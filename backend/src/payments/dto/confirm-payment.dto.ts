import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'pi_xxxxxxxxxxxxx', description: 'Stripe Payment Intent ID' })
  @IsString()
  paymentIntentId: string;
}
