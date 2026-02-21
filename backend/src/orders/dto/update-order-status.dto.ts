import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ 
    enum: OrderStatus, 
    example: 'PICKING',
    description: 'Order status: RECEIVED, PICKING, PACKED, OUT_FOR_DELIVERY, DELIVERED, READY_FOR_COLLECTION, COLLECTED, CANCELLED, REFUNDED'
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ example: 'Order confirmed and being prepared', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
