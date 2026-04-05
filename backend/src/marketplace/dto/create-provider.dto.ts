import { IsString, IsEnum, IsOptional, IsEmail, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderType } from '@prisma/client';

export class ServiceAreaDto {
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
  @IsInt()
  @Min(1)
  radiusKm?: number;
}

export class CreateProviderDto {
  @IsEnum(ProviderType)
  providerType: ProviderType;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsArray()
  @IsString({ each: true })
  categoryKeys: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAreaDto)
  serviceAreas: ServiceAreaDto[];
}
