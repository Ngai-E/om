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
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketplaceOfferService } from './services/marketplace-offer.service';
import { MarketplaceProviderService } from './services/marketplace-provider.service';
import { CreateMarketplaceOfferDto } from './dto';

@Controller('marketplace')
export class MarketplaceOfferController {
  constructor(
    private offerService: MarketplaceOfferService,
    private providerService: MarketplaceProviderService,
  ) {}

  /**
   * Submit offer to a request
   * POST /marketplace/requests/:id/offers
   * 
   * Sprint B: Only tenant-backed providers supported
   * User must have tenantId and an active provider profile
   */
  @Post('requests/:id/offers')
  @UseGuards(JwtAuthGuard)
  async submitOffer(
    @Param('id') requestId: string,
    @Body() dto: CreateMarketplaceOfferDto,
    @Request() req,
  ) {
    const user = req.user;
    
    // Sprint B: Enforce tenant-backed providers only
    if (!user.tenantId) {
      throw new ForbiddenException(
        'Only tenant-backed providers can submit offers. Please create a store first at /onboarding'
      );
    }
    
    // Get provider for this user's tenant
    const provider = await this.providerService.getProviderByTenantId(user.tenantId);
    if (!provider) {
      throw new NotFoundException(
        'Provider profile not found. Please complete your store setup at /onboarding'
      );
    }

    // Validate provider is active and can submit offers
    if (provider.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Cannot submit offers. Provider status is ${provider.status}. Please contact support.`
      );
    }

    return this.offerService.submitOffer(requestId, provider.id, dto);
  }

  /**
   * Withdraw offer
   * PATCH /marketplace/offers/:id/withdraw
   */
  @Patch('offers/:id/withdraw')
  @UseGuards(JwtAuthGuard)
  async withdrawOffer(@Param('id') offerId: string, @Request() req) {
    const user = req.user;
    
    if (!user.tenantId) {
      throw new ForbiddenException('Only tenant-backed providers can withdraw offers');
    }
    
    const provider = await this.providerService.getProviderByTenantId(user.tenantId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.offerService.withdrawOffer(offerId, provider.id);
  }

  /**
   * Get offer detail
   * GET /marketplace/offers/:id
   */
  @Get('offers/:id')
  async getOffer(@Param('id') id: string) {
    return this.offerService.getOffer(id);
  }

  /**
   * List my offers (provider)
   * GET /marketplace/providers/me/offers
   */
  @Get('providers/me/offers')
  @UseGuards(JwtAuthGuard)
  async listMyOffers(
    @Request() req,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const user = req.user;
    
    const provider = await this.providerService.getProviderByTenantId(user.tenantId);
    if (!provider) {
      return { offers: [], total: 0, limit: 20, offset: 0 };
    }

    return this.offerService.listProviderOffers(provider.id, {
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * List offers for a request
   * GET /marketplace/requests/:id/offers
   */
  @Get('requests/:id/offers')
  async listRequestOffers(@Param('id') requestId: string) {
    return this.offerService.listRequestOffers(requestId);
  }
}
