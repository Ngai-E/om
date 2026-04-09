import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProviderDto, UpdateProviderDto } from '../dto';
import { ProviderStatus } from '@prisma/client';

@Injectable()
export class MarketplaceProviderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new provider profile
   */
  async createProvider(dto: CreateProviderDto) {
    // Check if slug is unique if provided
    if (dto.slug) {
      const existing = await this.prisma.provider.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Provider slug already exists');
      }
    }

    // If tenant-backed, verify tenant exists and is active
    if (dto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: dto.tenantId },
      });
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
      if (tenant.status !== 'ACTIVE') {
        throw new BadRequestException('Tenant must be active to create provider');
      }
    }

    // Create provider with categories and service areas
    const provider = await this.prisma.provider.create({
      data: {
        providerType: dto.providerType,
        displayName: dto.displayName,
        slug: dto.slug,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        tenantId: dto.tenantId,
        categories: {
          create: dto.categoryKeys.map((key) => ({
            categoryKey: key,
          })),
        },
        serviceAreas: {
          create: dto.serviceAreas,
        },
      },
      include: {
        categories: true,
        serviceAreas: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    return provider;
  }

  /**
   * Get provider by ID
   */
  async getProvider(providerId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        categories: true,
        serviceAreas: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  /**
   * Get provider by slug
   */
  async getProviderBySlug(slug: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { slug },
      include: {
        categories: true,
        serviceAreas: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  /**
   * Get provider by tenant ID
   */
  async getProviderByTenantId(tenantId: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { tenantId },
      include: {
        categories: true,
        serviceAreas: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    return provider;
  }

  /**
   * Update provider profile
   */
  async updateProvider(providerId: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Update categories if provided
    if (dto.categoryKeys) {
      await this.prisma.providerCategory.deleteMany({
        where: { providerId },
      });
      await this.prisma.providerCategory.createMany({
        data: dto.categoryKeys.map((key) => ({
          providerId,
          categoryKey: key,
        })),
      });
    }

    // Update service areas if provided
    if (dto.serviceAreas) {
      await this.prisma.providerServiceArea.deleteMany({
        where: { providerId },
      });
      await this.prisma.providerServiceArea.createMany({
        data: dto.serviceAreas.map((area) => ({
          providerId,
          ...area,
        })),
      });
    }

    // Update provider fields
    const updated = await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        displayName: dto.displayName,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
      },
      include: {
        categories: true,
        serviceAreas: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Update provider status (admin only)
   */
  async updateProviderStatus(providerId: string, status: ProviderStatus) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return this.prisma.provider.update({
      where: { id: providerId },
      data: { status },
    });
  }

  /**
   * Mark provider as verified (admin only)
   */
  async verifyProvider(providerId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return this.prisma.provider.update({
      where: { id: providerId },
      data: { isVerified: true },
    });
  }

  /**
   * List all providers with filters
   */
  async listProviders(filters: {
    status?: ProviderStatus;
    providerType?: string;
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

    if (filters.providerType) {
      where.providerType = filters.providerType;
    }

    if (filters.categoryKey) {
      where.categories = {
        some: {
          categoryKey: filters.categoryKey,
        },
      };
    }

    if (filters.city || filters.countryCode) {
      where.serviceAreas = {
        some: {
          ...(filters.city && { city: filters.city }),
          ...(filters.countryCode && { countryCode: filters.countryCode }),
        },
      };
    }

    const [providers, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        include: {
          categories: true,
          serviceAreas: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
        },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return {
      providers,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(providerId: string) {
    const [provider, offerCount, matchCount] = await Promise.all([
      this.prisma.provider.findUnique({
        where: { id: providerId },
      }),
      this.prisma.marketplaceOffer.count({
        where: { providerId },
      }),
      this.prisma.marketplaceMatch.count({
        where: { providerId },
      }),
    ]);

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const acceptedOffers = await this.prisma.marketplaceOffer.count({
      where: {
        providerId,
        status: 'ACCEPTED',
      },
    });

    return {
      totalOffers: offerCount,
      acceptedOffers,
      totalMatches: matchCount,
      averageRating: provider.averageRating,
      totalReviews: provider.totalReviews,
    };
  }
}
