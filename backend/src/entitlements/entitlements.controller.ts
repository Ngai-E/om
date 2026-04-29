import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EntitlementsService } from './entitlements.service';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantRequiredGuard } from '../common/guards/tenant-required.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantContext } from '../common/interfaces/tenant-context.interface';

@ApiTags('entitlements')
@Controller('entitlements')
@UseGuards(JwtAuthGuard, TenantRequiredGuard)
@ApiBearerAuth()
export class EntitlementsController {
  constructor(
    private entitlementsService: EntitlementsService,
    private usageService: UsageService,
  ) {}

  @Get('current-plan')
  @ApiOperation({ summary: 'Get current plan details' })
  @ApiResponse({ status: 200, description: 'Plan details retrieved' })
  async getCurrentPlan(@CurrentTenant() tenant: TenantContext) {
    return this.entitlementsService.getCurrentPlan(tenant.id);
  }

  @Get('features')
  @ApiOperation({ summary: 'Get all entitlements for current tenant' })
  @ApiResponse({ status: 200, description: 'Entitlements retrieved' })
  async getEntitlements(@CurrentTenant() tenant: TenantContext) {
    return this.entitlementsService.getEntitlements(tenant.id);
  }
}

@ApiTags('usage')
@Controller('usage')
@UseGuards(JwtAuthGuard, TenantRequiredGuard)
@ApiBearerAuth()
export class UsageController {
  constructor(private usageService: UsageService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get usage statistics for current tenant' })
  @ApiResponse({ status: 200, description: 'Usage stats retrieved' })
  async getUsageStats(@CurrentTenant() tenant: TenantContext) {
    return this.usageService.getUsageStats(tenant.id);
  }
}
