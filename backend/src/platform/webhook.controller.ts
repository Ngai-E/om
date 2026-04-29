import { Controller, Post, Body, Headers, RawBody, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { Request } from 'express';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private platformService: PlatformService) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Handle Stripe webhooks for payment processing' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
    @Req() req: Request,
  ) {
    // TODO: Verify webhook signature using platform Stripe secret key
    const event = JSON.parse(rawBody.toString());

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payout.created':
      case 'payout.paid':
      case 'payout.failed':
        await this.handlePayoutEvent(event.type, event.data.object);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(paymentIntent: any) {
    try {
      // Find the order associated with this payment intent
      // Note: You'll need to store the payment_intent_id in the Payment model
      // For now, we'll use the metadata to find the order
      const orderId = paymentIntent.metadata?.orderId;
      
      if (orderId) {
        await this.platformService.processOrderPayment(orderId);
        console.log(`Processed payment for order: ${orderId}`);
      }
    } catch (error) {
      console.error('Error processing payment webhook:', error);
    }
  }

  private async handlePayoutEvent(eventType: string, payout: any) {
    try {
      // Find the tenant payout associated with this Stripe payout
      // This would require storing the stripe_payout_id in the TenantPayout model
      
      switch (eventType) {
        case 'payout.created':
          console.log(`Payout created: ${payout.id}`);
          break;
        
        case 'payout.paid':
          console.log(`Payout paid: ${payout.id}`);
          // Update payout status to COMPLETED
          break;
        
        case 'payout.failed':
          console.log(`Payout failed: ${payout.id}`);
          // Update payout status to FAILED
          break;
      }
    } catch (error) {
      console.error('Error processing payout webhook:', error);
    }
  }
}
