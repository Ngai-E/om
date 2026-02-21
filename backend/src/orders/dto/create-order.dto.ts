import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FulfillmentType } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ example: 'address-uuid', description: 'Delivery address ID (required for delivery)' })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiProperty({ enum: FulfillmentType, example: 'DELIVERY', description: 'Fulfillment type' })
  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType;

  @ApiProperty({ example: 'delivery-slot-uuid', description: 'Delivery slot ID (required for delivery)', required: false })
  @IsOptional()
  @IsUUID()
  deliverySlotId?: string;

  @ApiProperty({ example: 'Please ring the doorbell', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
