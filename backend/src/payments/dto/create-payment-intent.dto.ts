import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'order-uuid', description: 'Order ID' })
  @IsString()
  orderId: string;

  @ApiProperty({ 
    enum: PaymentMethod, 
    example: 'CARD',
    description: 'Payment method: CARD, APPLE_PAY, GOOGLE_PAY, CASH_ON_DELIVERY, PAY_IN_STORE'
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'http://localhost:3000/order/success', required: false })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({ example: 'http://localhost:3000/order/cancel', required: false })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
