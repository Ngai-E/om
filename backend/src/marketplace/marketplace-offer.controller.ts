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
   */
  @Post('requests/:id/offers')
  @UseGuards(JwtAuthGuard)
  async submitOffer(
    @Param('id') requestId: string,
    @Body() dto: CreateMarketplaceOfferDto,
    @Request() req,
  ) {
    const user = req.user;
    
    // Get provider for this user's tenant
    const provider = await this.providerService.getProviderByTenantId(user.tenantId);
    if (!provider) {
      throw new Error('Provider profile not found. Please create a provider profile first.');
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
    
    const provider = await this.providerService.getProviderByTenantId(user.tenantId);
    if (!provider) {
      throw new Error('Provider profile not found');
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
