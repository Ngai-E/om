import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto, ConfirmPaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private stripeService: StripeService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment for order (uses configured payment method)' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Payment already exists' })
  async createPayment(
    @CurrentUser() user: any,
    @Body() body: { orderId: string; successUrl: string; cancelUrl: string },
  ) {
    return this.paymentsService.createPaymentForOrder(
      body.orderId,
      user.id,
      body.successUrl,
      body.cancelUrl,
    );
  }

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for order (legacy)' })
  @ApiResponse({ status: 201, description: 'Payment intent created' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Payment already exists' })
  async createPaymentIntent(@CurrentUser() user: any, @Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(user.id, dto);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(dto);
  }

  @Post('webhook')
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      let event;
      
      // The raw body middleware converts the body to a Buffer
      // We need to convert it to a string for Stripe verification
      const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
      
      // Verify webhook signature for security
      if (signature && process.env.STRIPE_WEBHOOK_SECRET) {
        try {
          event = this.stripeService.constructWebhookEvent(rawBody, signature);
          console.log(`✅ Webhook signature verified: ${event.type}`);
        } catch (err) {
          console.error('❌ Webhook signature verification failed:', err.message);
          throw err;
        }
      } else {
        // Fallback for development without signature verification
        event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        console.log(`⚠️  Webhook received without signature verification: ${event.type}`);
      }
      
      console.log(`📥 Processing webhook: ${event.type}`);
      return this.paymentsService.handleWebhook(event);
    } catch (error) {
      console.error('❌ Webhook error:', error);
      throw error;
    }
  }

  @Post('create-payment-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment link for phone order (Staff/Admin only)' })
  @ApiResponse({ status: 201, description: 'Payment link created' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createPaymentLink(
    @Body() body: { orderId: string; successUrl: string; cancelUrl: string },
  ) {
    return this.paymentsService.createPaymentLink(body.orderId, body.successUrl, body.cancelUrl);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process refund (Admin only)' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Cannot refund this payment' })
  async processRefund(
    @Body() body: { orderId: string; amount?: number; reason?: string },
  ) {
    return this.paymentsService.processRefund(body.orderId, body.amount, body.reason);
  }

  @Get('verify/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment status with Stripe (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment status verified' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.verifyPaymentStatus(orderId);
  }
}
