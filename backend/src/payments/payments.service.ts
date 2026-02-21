import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto, ConfirmPaymentDto } from './dto';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    // Get order
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.payment) {
      throw new BadRequestException('Payment already exists for this order');
    }

    // Handle non-card payment methods
    if (dto.paymentMethod === 'CASH_ON_DELIVERY' || dto.paymentMethod === 'PAY_IN_STORE') {
      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: 'GBP',
          status: 'PENDING',
          paymentMethod: dto.paymentMethod,
        },
      });

      return {
        payment,
        requiresAction: false,
        message: `Order will be paid via ${dto.paymentMethod.replace('_', ' ')}`,
      };
    }

    // Create Stripe Payment Intent for card payments
    const paymentIntent = await this.stripeService.createPaymentIntent(
      Number(order.total),
      'gbp',
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
      },
    );

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        stripePaymentIntentId: paymentIntent.id,
        amount: order.total,
        currency: 'GBP',
        status: 'PENDING',
        paymentMethod: dto.paymentMethod,
      },
    });

    return {
      payment,
      clientSecret: paymentIntent.client_secret,
      requiresAction: true,
    };
  }

  async confirmPayment(dto: ConfirmPaymentDto) {
    // Retrieve payment intent from Stripe
    const paymentIntent = await this.stripeService.retrievePaymentIntent(dto.paymentIntentId);

    // Find payment record
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: dto.paymentIntentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status based on Stripe status
    let status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING' = 'PROCESSING';
    
    if (paymentIntent.status === 'succeeded') {
      status = 'SUCCEEDED';
    } else if (paymentIntent.status === 'canceled') {
      status = 'FAILED';
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        paidAt: status === 'SUCCEEDED' ? new Date() : null,
      },
      include: { order: true },
    });

    // Update order status if payment succeeded
    if (status === 'SUCCEEDED') {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'PICKING',
          statusHistory: {
            create: {
              status: 'PICKING',
              notes: 'Payment confirmed, order is being prepared',
            },
          },
        },
      });
    }

    return updatedPayment;
  }

  async handleWebhook(event: any) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleRefund(event.data.object);
          break;
        default:
          console.log(`ℹ️  Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error(`❌ Error handling webhook ${event.type}:`, error);
      // Don't throw - return success to Stripe to avoid retries
      return { received: true, error: error.message };
    }
  }

  private async handleCheckoutSessionCompleted(session: any) {
    console.log(`🔍 Looking for payment with session ID: ${session.id}`);
    
    // Find payment by checkout session ID
    const payment = await this.prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: session.id } as any,
    });

    if (!payment) {
      console.error(`❌ Payment not found for checkout session: ${session.id}`);
      return;
    }
    
    console.log(`✅ Found payment for order: ${payment.orderId}`);

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent, // Store payment intent ID
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'PICKING',
        statusHistory: {
          create: {
            status: 'PICKING',
            notes: 'Payment confirmed via Stripe Checkout, order is being prepared',
          },
        },
      },
    });

    console.log(`✅ Checkout session completed for order: ${payment.orderId}`);
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        paidAt: new Date(),
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'PICKING',
        statusHistory: {
          create: {
            status: 'PICKING',
            notes: 'Payment confirmed via webhook, order is being prepared',
          },
        },
      },
    });

    console.log(`✅ Payment succeeded for order: ${payment.orderId}`);
  }

  private async handlePaymentFailed(paymentIntent: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
      },
    });

    console.log(`❌ Payment failed for order: ${payment.orderId}`);
  }

  private async handleRefund(charge: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: charge.payment_intent },
    });

    if (!payment) {
      console.error(`Payment not found for charge: ${charge.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: charge.amount_refunded / 100,
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'REFUNDED',
        statusHistory: {
          create: {
            status: 'REFUNDED',
            notes: 'Payment refunded',
          },
        },
      },
    });

    console.log(`💰 Refund processed for order: ${payment.orderId}`);
  }

  async createPaymentLink(orderId: string, successUrl: string, cancelUrl: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.payment?.stripePaymentLinkId) {
      throw new BadRequestException('Payment link already exists for this order');
    }

    const { url: paymentLink, sessionId } = await this.stripeService.createPaymentLink(
      Number(order.total),
      order.orderNumber,
      successUrl,
      cancelUrl,
    );

    // Update or create payment record
    if (order.payment) {
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: { 
          stripePaymentLinkId: paymentLink,
          stripeCheckoutSessionId: sessionId,
        },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          stripePaymentLinkId: paymentLink,
          stripeCheckoutSessionId: sessionId,
          amount: order.total,
          currency: 'GBP',
          status: 'PENDING',
          paymentMethod: 'CARD',
        },
      });
    }

    return { paymentLink };
  }

  async verifyPaymentStatus(orderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      include: { order: true },
    }) as any;

    if (!payment) {
      throw new NotFoundException('Payment not found for this order');
    }

    let stripeStatus = null;
    let stripeDetails = null;

    // Check Stripe for actual payment status
    if (payment.stripeCheckoutSessionId) {
      try {
        const session = await this.stripeService.getStripe().checkout.sessions.retrieve(
          payment.stripeCheckoutSessionId,
          { expand: ['payment_intent'] }
        );
        
        stripeStatus = session.payment_status; // 'paid', 'unpaid', 'no_payment_required'
        stripeDetails = {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total / 100,
          currency: session.currency,
          paymentIntentId: session.payment_intent,
          customerEmail: session.customer_details?.email,
          created: new Date(session.created * 1000),
        };

        // If Stripe says paid but our DB says pending, update it
        if (session.payment_status === 'paid' && payment.status === 'PENDING') {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCEEDED',
              paidAt: new Date(),
              stripePaymentIntentId: typeof session.payment_intent === 'string' 
                ? session.payment_intent 
                : session.payment_intent?.id,
            },
          });

          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'PICKING',
              statusHistory: {
                create: {
                  status: 'PICKING',
                  notes: 'Payment verified and confirmed via manual check',
                },
              },
            },
          });

          console.log(`✅ Payment verified and updated for order: ${orderId}`);
        }
      } catch (error) {
        console.error('Error verifying payment with Stripe:', error);
        throw new BadRequestException('Failed to verify payment with Stripe');
      }
    } else if (payment.stripePaymentIntentId) {
      try {
        const paymentIntent = await this.stripeService.getStripe().paymentIntents.retrieve(
          payment.stripePaymentIntentId
        );
        
        stripeStatus = paymentIntent.status;
        stripeDetails = {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          created: new Date(paymentIntent.created * 1000),
        };

        // If Stripe says succeeded but our DB says pending, update it
        if (paymentIntent.status === 'succeeded' && payment.status === 'PENDING') {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCEEDED',
              paidAt: new Date(),
            },
          });

          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'PICKING',
              statusHistory: {
                create: {
                  status: 'PICKING',
                  notes: 'Payment verified and confirmed via manual check',
                },
              },
            },
          });

          console.log(`✅ Payment verified and updated for order: ${orderId}`);
        }
      } catch (error) {
        console.error('Error verifying payment intent with Stripe:', error);
        throw new BadRequestException('Failed to verify payment with Stripe');
      }
    }

    return {
      orderId,
      orderNumber: payment.order.orderNumber,
      localStatus: payment.status,
      stripeStatus,
      stripeDetails,
      amount: Number(payment.amount),
      paidAt: payment.paidAt,
      paymentMethod: payment.paymentMethod,
      statusMatch: stripeStatus 
        ? (stripeStatus === 'paid' || stripeStatus === 'succeeded') === (payment.status === 'SUCCEEDED')
        : null,
    };
  }

  async processRefund(orderId: string, amount?: number, reason?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'SUCCEEDED') {
      throw new BadRequestException('Can only refund succeeded payments');
    }

    if (!payment.stripePaymentIntentId) {
      throw new BadRequestException('No Stripe payment to refund');
    }

    // Process refund with Stripe
    const refund = await this.stripeService.createRefund(
      payment.stripePaymentIntentId,
      amount,
      reason,
    );

    // Update payment record
    const isPartialRefund = amount && amount < Number(payment.amount);
    
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isPartialRefund ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: refund.amount / 100,
        refundReason: reason,
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        statusHistory: {
          create: {
            status: 'REFUNDED',
            notes: reason || 'Refund processed',
          },
        },
      },
    });

    return { refund, message: 'Refund processed successfully' };
  }
}
