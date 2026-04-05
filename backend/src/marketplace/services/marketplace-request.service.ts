import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMarketplaceRequestDto, AddRequestImageDto } from '../dto';
import { MarketplaceRequestStatus } from '@prisma/client';

@Injectable()
export class MarketplaceRequestService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new marketplace request
   */
  async createRequest(buyerUserId: string, dto: CreateMarketplaceRequestDto) {
    // Validate budget range
    if (dto.budgetMin && dto.budgetMax && dto.budgetMin > dto.budgetMax) {
      throw new BadRequestException('budgetMin cannot be greater than budgetMax');
    }

    // Create request
    const request = await this.prisma.marketplaceRequest.create({
      data: {
        requestType: dto.requestType,
        buyerUserId,
        title: dto.title,
        description: dto.description,
        categoryKey: dto.categoryKey,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        currencyCode: dto.currencyCode,
        urgency: dto.urgency,
        countryCode: dto.countryCode,
        city: dto.city,
        region: dto.region,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusKm: dto.radiusKm,
        status: 'OPEN',
      },
      include: {
        images: true,
      },
    });

    return request;
  }

  /**
   * Add image to request
   */
  async addRequestImage(requestId: string, buyerUserId: string, dto: AddRequestImageDto) {
    const request = await this.prisma.marketplaceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.buyerUserId !== buyerUserId) {
      throw new ForbiddenException('You can only add images to your own requests');
    }

    // Check image count limit (max 5)
    const imageCount = await this.prisma.marketplaceRequestImage.count({
      where: { requestId },
    });

    if (imageCount >= 5) {
      throw new BadRequestException('Maximum 5 images allowed per request');
    }

    return this.prisma.marketplaceRequestImage.create({
      data: {
        requestId,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? imageCount,
      },
    });
  }

  /**
   * Get request by ID
   */
  async getRequest(requestId: string) {
    const request = await this.prisma.marketplaceRequest.findUnique({
      where: { id: requestId },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        offers: {
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
        },
        matches: {
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
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  /**
   * List buyer's requests
   */
  async listMyRequests(
    buyerUserId: string,
    filters: {
      status?: MarketplaceRequestStatus;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { buyerUserId };

    if (filters.status) {
      where.status = filters.status;
    }

    const [requests, total] = await Promise.all([
      this.prisma.marketplaceRequest.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              offers: true,
              matches: true,
            },
          },
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    };
  }

  /**
   * Cancel request
   */
  async cancelRequest(requestId: string, buyerUserId: string) {
    const request = await this.prisma.marketplaceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.buyerUserId !== buyerUserId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (request.status === 'ACCEPTED' || request.status === 'CLOSED') {
      throw new BadRequestException('Cannot cancel request in current status');
    }

    return this.prisma.marketplaceRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELED' },
    });
  }

  /**
   * Update request status (internal use)
   */
  async updateRequestStatus(requestId: string, status: MarketplaceRequestStatus) {
    return this.prisma.marketplaceRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }

  /**
   * Increment matched count
   */
  async incrementMatchedCount(requestId: string) {
    return this.prisma.marketplaceRequest.update({
      where: { id: requestId },
      data: {
        matchedCount: { increment: 1 },
      },
    });
  }

  /**
   * Increment offer count
   */
  async incrementOfferCount(requestId: string) {
    return this.prisma.marketplaceRequest.update({
      where: { id: requestId },
      data: {
        offerCount: { increment: 1 },
      },
    });
  }

  /**
   * Set accepted offer
   */
  async setAcceptedOffer(requestId: string, offerId: string) {
    return this.prisma.marketplaceRequest.update({
      where: { id: requestId },
      data: {
        acceptedOfferId: offerId,
        status: 'ACCEPTED',
      },
    });
  }

  /**
   * List all requests (admin/provider view)
   */
  async listRequests(filters: {
    status?: MarketplaceRequestStatus;
    categoryKey?: string;
    city?: string;
    countryCode?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.categoryKey) {
      where.categoryKey = filters.categoryKey;
    }

    if (filters.city) {
      where.city = filters.city;
    }

    if (filters.countryCode) {
      where.countryCode = filters.countryCode;
    }

    const [requests, total] = await Promise.all([
      this.prisma.marketplaceRequest.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              offers: true,
              matches: true,
            },
          },
        },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  /**
   * Get request statistics
   */
  async getRequestStats(requestId: string) {
    const request = await this.prisma.marketplaceRequest.findUnique({
      where: { id: requestId },
      include: {
        _count: {
          select: {
            offers: true,
            matches: true,
            images: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return {
      status: request.status,
      matchedCount: request.matchedCount,
      offerCount: request.offerCount,
      imageCount: request._count.images,
      hasAcceptedOffer: !!request.acceptedOfferId,
    };
  }
}
