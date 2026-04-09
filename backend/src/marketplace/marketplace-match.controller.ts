import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketplaceMatchingService } from './services/marketplace-matching.service';
import { MarketplaceProviderService } from './services/marketplace-provider.service';

@Controller('marketplace')
export class MarketplaceMatchController {
  constructor(
    private matchingService: MarketplaceMatchingService,
    private providerService: MarketplaceProviderService,
  ) {}

  /**
   * Get my matches (provider)
   * GET /marketplace/providers/me/matches
   */
  @Get('providers/me/matches')
  @UseGuards(JwtAuthGuard)
  async getMyMatches(
    @Request() req,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const user = req.user;
    
    // Sprint B: Enforce tenant-backed providers only
    if (!user.tenantId) {
      throw new ForbiddenException(
        'Only tenant-backed providers can view matches. Please create a store first at /onboarding'
      );
    }
    
    // Get provider for this user's tenant
    const provider = await this.providerService.getProviderByTenantId(user.tenantId);
    if (!provider) {
      throw new NotFoundException(
        'Provider profile not found. Please complete your store setup at /onboarding'
      );
    }

    return this.matchingService.getProviderMatches(provider.id, {
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * Mark match as viewed
   * PATCH /marketplace/matches/:id/view
   */
  @Patch('matches/:id/view')
  @UseGuards(JwtAuthGuard)
  async markMatchViewed(@Param('id') matchId: string, @Request() req) {
    const user = req.user;
    
    if (!user.tenantId) {
      throw new ForbiddenException('Only tenant-backed providers can mark matches as viewed');
    }
    
    const provider = await this.providerService.getProviderByTenantId(user.tenantId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.matchingService.markMatchViewed(matchId);
  }

  /**
   * Skip a match
   * PATCH /marketplace/matches/:id/skip
   */
  @Patch('matches/:id/skip')
  @UseGuards(JwtAuthGuard)
  async skipMatch(@Param('id') matchId: string, @Request() req) {
    const user = req.user;
    
    if (!user.tenantId) {
      throw new ForbiddenException('Only tenant-backed providers can skip matches');
    }
    
    const provider = await this.providerService.getProviderByTenantId(user.tenantId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.matchingService.skipMatch(matchId);
  }
}
