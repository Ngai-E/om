import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MarketplaceProviderService } from './services/marketplace-provider.service';
import { CreateProviderDto, UpdateProviderDto } from './dto';

@Controller('marketplace/providers')
export class MarketplaceProviderController {
  constructor(private providerService: MarketplaceProviderService) {}

  /**
   * Create provider profile
   * POST /marketplace/providers
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createProvider(@Body() dto: CreateProviderDto, @Request() req) {
    return this.providerService.createProvider(dto);
  }

  /**
   * Get my provider profile
   * GET /marketplace/providers/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProvider(@Request() req) {
    const user = req.user;
    
    // Try to find provider by tenant if user has one
    if (user.tenantId) {
      const provider = await this.providerService.getProviderByTenantId(user.tenantId);
      if (provider) {
        return provider;
      }
    }

    return null;
  }

  /**
   * Update my provider profile
   * PATCH /marketplace/providers/me
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProvider(@Body() dto: UpdateProviderDto, @Request() req) {
    const user = req.user;
    
    // Find provider by tenant
    if (!user.tenantId) {
      throw new Error('User must be associated with a tenant to update provider');
    }

    const provider = await this.providerService.getProviderByTenantId(user.tenantId);
    if (!provider) {
      throw new Error('Provider profile not found');
    }

    return this.providerService.updateProvider(provider.id, dto);
  }

  /**
   * Get provider by ID
   * GET /marketplace/providers/:id
   */
  @Get(':id')
  async getProvider(@Param('id') id: string) {
    return this.providerService.getProvider(id);
  }

  /**
   * Get provider by slug
   * GET /marketplace/providers/slug/:slug
   */
  @Get('slug/:slug')
  async getProviderBySlug(@Param('slug') slug: string) {
    return this.providerService.getProviderBySlug(slug);
  }

  /**
   * Get provider statistics
   * GET /marketplace/providers/:id/stats
   */
  @Get(':id/stats')
  async getProviderStats(@Param('id') id: string) {
    return this.providerService.getProviderStats(id);
  }

  /**
   * List providers with filters
   * GET /marketplace/providers
   */
  @Get()
  async listProviders(
    @Query('status') status?: string,
    @Query('providerType') providerType?: string,
    @Query('categoryKey') categoryKey?: string,
    @Query('city') city?: string,
    @Query('countryCode') countryCode?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.providerService.listProviders({
      status: status as any,
      providerType,
      categoryKey,
      city,
      countryCode,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * Update provider status (admin only)
   * PATCH /marketplace/providers/:id/status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async updateProviderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.providerService.updateProviderStatus(id, status as any);
  }

  /**
   * Verify provider (admin only)
   * POST /marketplace/providers/:id/verify
   */
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async verifyProvider(@Param('id') id: string) {
    return this.providerService.verifyProvider(id);
  }
}
