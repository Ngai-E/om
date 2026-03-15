import { IsString, IsEmail, IsArray, IsEnum, IsOptional, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FulfillmentType } from '@prisma/client';

class OrderItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreatePhoneOrderDto {
  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  customerId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ enum: FulfillmentType, example: 'DELIVERY' })
  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType;

  @ApiProperty({ example: 'CASH_ON_DELIVERY' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ example: 'address-uuid', required: false })
  @IsOptional()
  @IsString()
  addressId?: string;

  @ApiProperty({ example: 'slot-uuid', required: false })
  @IsOptional()
  @IsString()
  deliverySlotId?: string;

  @ApiProperty({ example: 'Customer prefers ripe plantains', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'FIRST10', description: 'Promo code to apply', required: false })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
