import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async getActiveTenants(options: {
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }) {
    const { search, category, limit = 50, offset = 0 } = options;

    const where: any = {
      status: 'ACTIVE',
      deletedAt: null,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
      include: {
        branding: true,
        domains: {
          where: { verificationStatus: 'VERIFIED' },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return tenants;
  }

  async getFeaturedStores() {
    // Get stores with most products or recently active
    const featured = await this.prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        branding: true,
        domains: {
          where: { verificationStatus: 'VERIFIED' },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [
        { products: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: 8,
    });

    return featured;
  }

  async getCategories() {
    // For now, return basic categories. In a real implementation,
    // this could be based on product categories across all tenants
    const categories = [
      { id: 'grocery', name: 'Grocery', storeCount: 0, icon: '🛒' },
      { id: 'fashion', name: 'Fashion', storeCount: 0, icon: '👗' },
      { id: 'electronics', name: 'Electronics', storeCount: 0, icon: '📱' },
      { id: 'home', name: 'Home & Garden', storeCount: 0, icon: '🏠' },
      { id: 'health', name: 'Health & Beauty', storeCount: 0, icon: '💄' },
      { id: 'food', name: 'Food & Dining', storeCount: 0, icon: '🍽️' },
    ];

    // Count stores per category (simplified - in real implementation, 
    // you'd have category mapping on products/stores)
    for (const category of categories) {
      category.storeCount = await this.prisma.tenant.count({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
          // In a real implementation, you'd filter by actual category
          name: { contains: category.name, mode: 'insensitive' },
        },
      });
    }

    return categories;
  }

  async searchProducts(query: string, options: {
    tenantId?: string;
    limit?: number;
    offset?: number;
  }) {
    const { tenantId, limit = 20, offset = 0 } = options;

    const where: any = {
      isActive: true,
      tenant: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              branding: {
                select: {
                  logoUrl: true,
                  primaryColor: true,
                },
              },
              domains: {
                where: { verificationStatus: 'VERIFIED' },
                select: { domain: true, type: true },
              },
            },
          },
          images: {
            take: 1,
          },
          category: true,
        },
        orderBy: [
          { name: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async getTrendingProducts(options: {
    limit?: number;
    offset?: number;
  }) {
    const { limit = 20, offset = 0 } = options;

    // Trending could be based on recent orders, views, etc.
    // For now, we'll return recent products from active tenants
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        tenant: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            branding: {
              select: {
                logoUrl: true,
                primaryColor: true,
              },
            },
            domains: {
              where: { verificationStatus: 'VERIFIED' },
              select: { domain: true, type: true },
            },
          },
        },
        images: {
          take: 1,
        },
        category: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return { products };
  }
}
