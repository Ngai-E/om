import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMarketplaceOfferDto } from '../dto';
import { MarketplaceRequestService } from './marketplace-request.service';

@Injectable()
export class MarketplaceOfferService {
  constructor(
    private prisma: PrismaService,
    private requestService: MarketplaceRequestService,
  ) {}

  /**
   * Submit an offer to a marketplace request
   */
  async submitOffer(requestId: string, providerId: string, dto: CreateMarketplaceOfferDto) {
    // Verify request exists and is accepting offers
    const request = await this.prisma.marketplaceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status === 'CANCELED' || request.status === 'CLOSED' || request.status === 'ACCEPTED') {
      throw new BadRequestException('Request is not accepting offers');
    }

    // Check if provider already has an active offer
    const existingOffer = await this.prisma.marketplaceOffer.findFirst({
      where: {
        requestId,
        providerId,
        status: { in: ['SUBMITTED'] },
      },
    });

    if (existingOffer) {
      throw new BadRequestException('You already have an active offer for this request');
    }

    // Create offer
    const offer = await this.prisma.marketplaceOffer.create({
      data: {
        requestId,
        providerId,
        price: dto.price,
        currencyCode: dto.currencyCode,
        estimatedEta: dto.estimatedEta,
        message: dto.message,
        attachmentUrl: dto.attachmentUrl,
        status: 'SUBMITTED',
      },
      include: {
        provider: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            averageRating: true,
            totalReviews: true,
            isVerified: true,
          },
        },
      },
    });

    // Increment offer count on request
    await this.requestService.incrementOfferCount(requestId);

    return offer;
  }

  /**
   * Withdraw an offer
   */
  async withdrawOffer(offerId: string, providerId: string) {
    const offer = await this.prisma.marketplaceOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.providerId !== providerId) {
      throw new ForbiddenException('You can only withdraw your own offers');
    }

    if (offer.status !== 'SUBMITTED') {
      throw new BadRequestException('Can only withdraw submitted offers');
    }

    return this.prisma.marketplaceOffer.update({
      where: { id: offerId },
      data: { status: 'WITHDRAWN' },
    });
  }

  /**
   * Get offer by ID
   */
  async getOffer(offerId: string) {
    const offer = await this.prisma.marketplaceOffer.findUnique({
      where: { id: offerId },
      include: {
        provider: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            averageRating: true,
            totalReviews: true,
            isVerified: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  /**
   * List provider's offers
   */
  async listProviderOffers(
    providerId: string,
    filters: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { providerId };

    if (filters.status) {
      where.status = filters.status;
    }

    const [offers, total] = await Promise.all([
      this.prisma.marketplaceOffer.findMany({
        where,
        include: {
          request: {
            include: {
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          },
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceOffer.count({ where }),
    ]);

    return {
      offers,
      total,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    };
  }

  /**
   * List offers for a request
   */
  async listRequestOffers(requestId: string) {
    return this.prisma.marketplaceOffer.findMany({
      where: { requestId },
      include: {
        provider: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            averageRating: true,
            totalReviews: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Accept an offer (internal use - called from acceptance flow)
   */
  async acceptOffer(offerId: string) {
    return this.prisma.marketplaceOffer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED' },
    });
  }

  /**
   * Reject offers (internal use - called when another offer is accepted)
   */
  async rejectOtherOffers(requestId: string, acceptedOfferId: string) {
    return this.prisma.marketplaceOffer.updateMany({
      where: {
        requestId,
        id: { not: acceptedOfferId },
        status: 'SUBMITTED',
      },
      data: { status: 'REJECTED' },
    });
  }

  /**
   * Update offer status (admin use)
   */
  async updateOfferStatus(offerId: string, status: string) {
    return this.prisma.marketplaceOffer.update({
      where: { id: offerId },
      data: { status: status as any },
    });
  }
}
