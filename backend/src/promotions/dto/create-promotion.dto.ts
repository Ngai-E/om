import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FulfillmentType } from '@prisma/client';

export enum PromotionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

export enum BudgetType {
  NONE = 'NONE',
  TOTAL_DISCOUNT = 'TOTAL_DISCOUNT',
  TOTAL_USES = 'TOTAL_USES',
  BOTH = 'BOTH',
}

export enum DiscountType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export class CreatePromotionDto {
  @ApiProperty({ example: 'First Order 10% Off' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Get 10% off your first order over £30', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/promo.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'FIRST10', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ enum: PromotionStatus, example: PromotionStatus.DRAFT })
  @IsEnum(PromotionStatus)
  status: PromotionStatus;

  @ApiProperty({ example: '2026-03-15T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiProperty({ example: '2026-04-15T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiProperty({ enum: BudgetType, example: BudgetType.BOTH })
  @IsEnum(BudgetType)
  budgetType: BudgetType;

  @ApiProperty({ example: 500.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTotalDiscountAmount?: number;

  @ApiProperty({ example: 200, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTotalRedemptions?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptionsPerUser?: number;

  @ApiProperty({ example: 30.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSubtotal?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  firstOrderOnly: boolean;

  @ApiProperty({ enum: FulfillmentType, required: false })
  @IsOptional()
  @IsEnum(FulfillmentType)
  allowedFulfillment?: FulfillmentType;

  @ApiProperty({ example: true })
  @IsBoolean()
  allowGuests: boolean;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENT })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({ example: 10.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountPerOrder?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  applyToSubtotal: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  applyToDeliveryFee: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  allowStacking: boolean;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  priority: number;

  @ApiProperty({ example: 0, required: false, description: 'Usage count for social proof (can be manually updated)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageCount?: number;

  @ApiProperty({ example: false, required: false, description: 'Mark as featured deal for promotions page' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
