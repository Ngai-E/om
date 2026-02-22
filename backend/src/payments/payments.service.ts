import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto, ConfirmPaymentDto } from './dto';
import { PaymentMethod } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private settingsService: SettingsService,
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

  async createPaymentForOrder(
    orderId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    // Get order with items
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        payment: true,
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        deliverySlot: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.payment?.status === 'SUCCEEDED') {
      throw new BadRequestException('Order has already been paid');
    }

    // Get selected payment method from settings
    const paymentMethod = await this.settingsService.getPaymentMethod();
    console.log('💳 Payment method from settings:', paymentMethod);

    if (paymentMethod === 'stripe_checkout') {
      // Create Stripe Checkout Session
      const orderData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        items: order.items.map(item => ({
          name: item.productName,
          price: Number(item.productPrice),
          quantity: item.quantity,
          image: item.product.images[0]?.url,
        })),
        total: Number(order.total),
        deliveryFee: order.deliverySlot ? Number(order.deliveryFee || 0) : 0,
      };

      const { url, sessionId } = await this.stripeService.createCheckoutSession(
        orderData,
        successUrl,
        cancelUrl,
      );

      // Create or update payment record
      if (order.payment) {
        await this.prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            stripeCheckoutSessionId: sessionId,
            status: 'PENDING',
          },
        });
      } else {
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            stripeCheckoutSessionId: sessionId,
            amount: order.total,
            currency: 'GBP',
            status: 'PENDING',
            paymentMethod: 'CARD',
          },
        });
      }

      return {
        type: 'redirect',
        url,
        sessionId,
      };
    } else {
      // Create Payment Intent for Stripe Elements
      const paymentIntent = await this.stripeService.createPaymentIntent(
        Number(order.total),
        'gbp',
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
        },
      );

      // Create or update payment record
      if (order.payment) {
        await this.prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            stripePaymentIntentId: paymentIntent.id,
            status: 'PENDING',
          },
        });
      } else {
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            stripePaymentIntentId: paymentIntent.id,
            amount: order.total,
            currency: 'GBP',
            status: 'PENDING',
            paymentMethod: 'CARD',
          },
        });
      }

      return {
        type: 'client_secret',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }
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
        case 'charge.succeeded':
          await this.handleChargeSucceeded(event.data.object);
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
    console.log(`📋 Session payment_intent: ${session.payment_intent}`);
    console.log(`📋 Session payment_status: ${session.payment_status}`);
    
    // Find payment by checkout session ID
    const payment = await this.prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: session.id } as any,
    });

    if (!payment) {
      console.error(`❌ Payment not found for checkout session: ${session.id}`);
      console.log(`🔍 Attempting to find by payment_intent: ${session.payment_intent}`);
      
      // Try to find by payment intent as fallback
      const paymentByIntent = await this.prisma.payment.findFirst({
        where: { stripePaymentIntentId: session.payment_intent },
      });
      
      if (!paymentByIntent) {
        console.error(`❌ Payment not found by payment_intent either`);
        return;
      }
      
      console.log(`✅ Found payment by payment_intent for order: ${paymentByIntent.orderId}`);
      
      // Update with session ID and mark as succeeded
      await this.prisma.payment.update({
        where: { id: paymentByIntent.id },
        data: {
          status: 'SUCCEEDED',
          paidAt: new Date(),
          stripeCheckoutSessionId: session.id,
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: paymentByIntent.orderId },
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

      console.log(`✅ Checkout session completed for order: ${paymentByIntent.orderId}`);
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

  private async handleChargeSucceeded(charge: any) {
    // charge.succeeded is sent after payment_intent.succeeded or checkout.session.completed
    // Try to find payment by payment_intent first
    let payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: charge.payment_intent },
    });

    // If not found and charge has invoice (from checkout), try to find by other means
    if (!payment && charge.payment_intent) {
      // The payment might exist but payment_intent not yet stored
      // This is informational only - checkout.session.completed will handle it
      console.log(`ℹ️  Charge succeeded (${charge.id}) - will be processed by checkout.session.completed webhook`);
      return;
    }

    if (!payment) {
      console.log(`ℹ️  Charge succeeded but payment not found: ${charge.id}`);
      return;
    }

    // Update payment with charge details if not already succeeded
    if (payment.status !== 'SUCCEEDED') {
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
              notes: 'Payment confirmed via charge webhook, order is being prepared',
            },
          },
        },
      });

      console.log(`✅ Charge succeeded for order: ${payment.orderId}`);
    } else {
      console.log(`ℹ️  Charge succeeded for already completed payment: ${payment.orderId}`);
    }
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
