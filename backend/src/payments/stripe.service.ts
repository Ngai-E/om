import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get('STRIPE_SECRET_KEY');
    
    if (!apiKey) {
      console.warn('⚠️  STRIPE_SECRET_KEY not configured. Payment features will not work.');
      return;
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });

    console.log('✅ Stripe initialized');
  }

  getStripe(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe is not initialized. Please configure STRIPE_SECRET_KEY.');
    }
    return this.stripe;
  }

  async createPaymentIntent(amount: number, currency = 'gbp', metadata?: any): Promise<Stripe.PaymentIntent> {
    return this.getStripe().paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.getStripe().paymentIntents.retrieve(paymentIntentId);
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.getStripe().paymentIntents.confirm(paymentIntentId);
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.getStripe().paymentIntents.cancel(paymentIntentId);
  }

  async createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<Stripe.Refund> {
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    if (reason) {
      refundData.reason = reason as Stripe.RefundCreateParams.Reason;
    }

    return this.getStripe().refunds.create(refundData);
  }

  async createPaymentLink(
    amount: number,
    orderId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string; sessionId: string }> {
    const session = await this.getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Order ${orderId}`,
              description: 'OMEGA AFRO SHOP Order',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId,
      },
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    return this.getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
