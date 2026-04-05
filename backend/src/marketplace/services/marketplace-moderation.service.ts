import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketplaceModerationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a moderation flag
   */
  async createFlag(targetType: string, targetId: string, reason: string) {
    return this.prisma.marketplaceModerationFlag.create({
      data: {
        targetType: targetType as any,
        targetId,
        reason,
        status: 'OPEN',
      },
    });
  }

  /**
   * List all flags
   */
  async listFlags(filters: {
    targetType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [flags, total] = await Promise.all([
      this.prisma.marketplaceModerationFlag.findMany({
        where,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceModerationFlag.count({ where }),
    ]);

    return {
      flags,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  /**
   * Update flag status
   */
  async updateFlagStatus(flagId: string, status: string) {
    return this.prisma.marketplaceModerationFlag.update({
      where: { id: flagId },
      data: { status },
    });
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats() {
    const [
      totalRequests,
      openRequests,
      totalProviders,
      activeProviders,
      totalOffers,
      acceptedOffers,
      totalMatches,
      openFlags,
    ] = await Promise.all([
      this.prisma.marketplaceRequest.count(),
      this.prisma.marketplaceRequest.count({ where: { status: 'OPEN' } }),
      this.prisma.provider.count(),
      this.prisma.provider.count({ where: { status: 'ACTIVE' } }),
      this.prisma.marketplaceOffer.count(),
      this.prisma.marketplaceOffer.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.marketplaceMatch.count(),
      this.prisma.marketplaceModerationFlag.count({ where: { status: 'OPEN' } }),
    ]);

    // Get request status breakdown
    const requestsByStatus = await this.prisma.marketplaceRequest.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get provider type breakdown
    const providersByType = await this.prisma.provider.groupBy({
      by: ['providerType'],
      _count: true,
    });

    return {
      requests: {
        total: totalRequests,
        open: openRequests,
        byStatus: requestsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      providers: {
        total: totalProviders,
        active: activeProviders,
        byType: providersByType.reduce((acc, item) => {
          acc[item.providerType] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      offers: {
        total: totalOffers,
        accepted: acceptedOffers,
      },
      matches: {
        total: totalMatches,
      },
      moderation: {
        openFlags,
      },
    };
  }

  /**
   * Get tenant marketplace activity
   */
  async getTenantMarketplaceActivity(tenantId: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { tenantId },
    });

    if (!provider) {
      return {
        hasProvider: false,
        offers: 0,
        acceptedOffers: 0,
        matches: 0,
      };
    }

    const [offerCount, acceptedOffers, matchCount] = await Promise.all([
      this.prisma.marketplaceOffer.count({ where: { providerId: provider.id } }),
      this.prisma.marketplaceOffer.count({
        where: { providerId: provider.id, status: 'ACCEPTED' },
      }),
      this.prisma.marketplaceMatch.count({ where: { providerId: provider.id } }),
    ]);

    return {
      hasProvider: true,
      providerId: provider.id,
      providerStatus: provider.status,
      offers: offerCount,
      acceptedOffers,
      matches: matchCount,
    };
  }
}
