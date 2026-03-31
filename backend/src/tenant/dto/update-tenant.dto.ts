import { PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiProperty({ enum: ['PENDING_SETUP', 'ACTIVE', 'SUSPENDED', 'CANCELLED'], required: false })
  @IsOptional()
  @IsEnum(['PENDING_SETUP', 'ACTIVE', 'SUSPENDED', 'CANCELLED'])
  status?: string;

  @ApiProperty({ enum: ['TRIAL', 'BILLING_ACTIVE', 'PAST_DUE', 'BILLING_CANCELLED', 'FREE'], required: false })
  @IsOptional()
  @IsEnum(['TRIAL', 'BILLING_ACTIVE', 'PAST_DUE', 'BILLING_CANCELLED', 'FREE'])
  billingStatus?: string;
}
