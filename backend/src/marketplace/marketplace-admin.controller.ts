import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MarketplaceModerationService } from './services/marketplace-moderation.service';
import { MarketplaceProviderService } from './services/marketplace-provider.service';

@Controller('platform/marketplace')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class MarketplaceAdminController {
  constructor(
    private moderationService: MarketplaceModerationService,
    private providerService: MarketplaceProviderService,
  ) {}

  /**
   * Get marketplace statistics
   * GET /platform/marketplace/stats
   */
  @Get('stats')
  async getMarketplaceStats() {
    return this.moderationService.getMarketplaceStats();
  }

  /**
   * Get tenant marketplace activity
   * GET /platform/marketplace/tenants/:tenantId/activity
   */
  @Get('tenants/:tenantId/activity')
  async getTenantActivity(@Param('tenantId') tenantId: string) {
    return this.moderationService.getTenantMarketplaceActivity(tenantId);
  }

  /**
   * Create moderation flag
   * POST /platform/marketplace/flags
   */
  @Post('flags')
  async createFlag(
    @Body('targetType') targetType: string,
    @Body('targetId') targetId: string,
    @Body('reason') reason: string,
  ) {
    return this.moderationService.createFlag(targetType, targetId, reason);
  }

  /**
   * List moderation flags
   * GET /platform/marketplace/flags
   */
  @Get('flags')
  async listFlags(
    @Query('targetType') targetType?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.moderationService.listFlags({
      targetType,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * Update flag status
   * PATCH /platform/marketplace/flags/:id/status
   */
  @Patch('flags/:id/status')
  async updateFlagStatus(
    @Param('id') flagId: string,
    @Body('status') status: string,
  ) {
    return this.moderationService.updateFlagStatus(flagId, status);
  }

  /**
   * Update provider status
   * PATCH /platform/marketplace/providers/:id/status
   */
  @Patch('providers/:id/status')
  async updateProviderStatus(
    @Param('id') providerId: string,
    @Body('status') status: string,
  ) {
    return this.providerService.updateProviderStatus(providerId, status as any);
  }

  /**
   * Verify provider
   * POST /platform/marketplace/providers/:id/verify
   */
  @Post('providers/:id/verify')
  async verifyProvider(@Param('id') providerId: string) {
    return this.providerService.verifyProvider(providerId);
  }

  /**
   * List all providers (admin view)
   * GET /platform/marketplace/providers
   */
  @Get('providers')
  async listProviders(
    @Query('status') status?: string,
    @Query('providerType') providerType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.providerService.listProviders({
      status: status as any,
      providerType,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }
}
