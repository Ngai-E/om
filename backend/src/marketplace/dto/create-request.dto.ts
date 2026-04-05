import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MarketplaceRequestType } from '@prisma/client';

export class CreateMarketplaceRequestDto {
  @IsEnum(MarketplaceRequestType)
  requestType: MarketplaceRequestType;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  categoryKey: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  urgency?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  radiusKm?: number;
}

export class AddRequestImageDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
