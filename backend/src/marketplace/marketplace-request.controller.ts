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
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketplaceRequestService } from './services/marketplace-request.service';
import { MarketplaceOfferService } from './services/marketplace-offer.service';
import { CreateMarketplaceRequestDto, AddRequestImageDto } from './dto';

@Controller('marketplace/requests')
export class MarketplaceRequestController {
  constructor(
    private requestService: MarketplaceRequestService,
    private offerService: MarketplaceOfferService,
  ) {}

  /**
   * Create marketplace request
   * POST /marketplace/requests
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createRequest(@Body() dto: CreateMarketplaceRequestDto, @Request() req) {
    const buyerUserId = req.user.id;
    const request = await this.requestService.createRequest(buyerUserId, dto);
    
    // Trigger matching automatically after request creation
    // This is done asynchronously to not block the response
    this.requestService.triggerMatching(request.id).catch(err => {
      console.error(`Failed to trigger matching for request ${request.id}:`, err);
    });
    
    return request;
  }

  /**
   * Add image to request
   * POST /marketplace/requests/:id/images
   */
  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  async addRequestImage(
    @Param('id') requestId: string,
    @Body() dto: AddRequestImageDto,
    @Request() req,
  ) {
    const buyerUserId = req.user.id;
    return this.requestService.addRequestImage(requestId, buyerUserId, dto);
  }

  /**
   * List all requests (public/provider view)
   * GET /marketplace/requests
   */
  @Get()
  async listRequests(
    @Query('status') status?: string,
    @Query('categoryKey') categoryKey?: string,
    @Query('city') city?: string,
    @Query('countryCode') countryCode?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.requestService.listRequests({
      status: status as any,
      categoryKey,
      city,
      countryCode,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * List my requests
   * GET /marketplace/my/requests
   */
  @Get('my/requests')
  @UseGuards(JwtAuthGuard)
  async listMyRequests(
    @Request() req,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const buyerUserId = req.user.id;
    return this.requestService.listMyRequests(buyerUserId, {
      status: status as any,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * Get request statistics
   * GET /marketplace/requests/:id/stats
   */
  @Get(':id/stats')
  async getRequestStats(@Param('id') id: string) {
    return this.requestService.getRequestStats(id);
  }

  /**
   * Get request detail (public - limited info)
   * GET /marketplace/requests/:id
   */
  @Get(':id')
  async getRequest(@Param('id') id: string, @Request() req) {
    // Check if authenticated user is the owner
    const userId = req.user?.id;
    return this.requestService.getPublicRequest(id, userId);
  }

  /**
   * Cancel request
   * PATCH /marketplace/requests/:id/cancel
   */
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelRequest(@Param('id') requestId: string, @Request() req) {
    const buyerUserId = req.user.id;
    return this.requestService.cancelRequest(requestId, buyerUserId);
  }

  /**
   * Accept an offer
   * PATCH /marketplace/requests/:id/offers/:offerId/accept
   */
  @Patch(':id/offers/:offerId/accept')
  @UseGuards(JwtAuthGuard)
  async acceptOffer(
    @Param('id') requestId: string,
    @Param('offerId') offerId: string,
    @Request() req,
  ) {
    const buyerUserId = req.user.id;

    // Verify request belongs to buyer
    const request = await this.requestService.getBuyerRequest(requestId, buyerUserId);
    
    // Verify offer belongs to this request
    const offer = await this.offerService.getOffer(offerId);
    if (offer.requestId !== requestId) {
      throw new BadRequestException('Offer does not belong to this request');
    }

    // Execute acceptance flow
    // 1. Accept the selected offer
    await this.offerService.acceptOffer(offerId);

    // 2. Reject all other submitted offers
    await this.offerService.rejectOtherOffers(requestId, offerId);

    // 3. Update request status and set accepted offer
    await this.requestService.setAcceptedOffer(requestId, offerId);

    // Return updated request
    return this.requestService.getBuyerRequest(requestId, buyerUserId);
  }
}
