import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePackageDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'] })
  @IsEnum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'])
  tier: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ default: 'monthly' })
  @IsString()
  billingCycle: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxOrders?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxProducts?: number;

  @ApiProperty({ description: 'Feature flags object' })
  @IsObject()
  features: Record<string, boolean>;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
