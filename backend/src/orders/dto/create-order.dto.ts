import { IsString, IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
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

  @ApiProperty({ example: 'delivery-slot-uuid', description: 'Delivery slot ID or template ID (required for delivery)', required: false })
  @IsOptional()
  @IsString()
  deliverySlotId?: string;

  // Optional: slot details for creating from template
  @ApiProperty({ example: '2026-03-14', required: false })
  @IsOptional()
  @IsString()
  slotDate?: string;

  @ApiProperty({ example: '09:00', required: false })
  @IsOptional()
  @IsString()
  slotStartTime?: string;

  @ApiProperty({ example: '11:00', required: false })
  @IsOptional()
  @IsString()
  slotEndTime?: string;

  @ApiProperty({ example: 'Please ring the doorbell', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
