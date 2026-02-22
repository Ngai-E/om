import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(filters?: {
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    isFeatured?: boolean;
    page?: number;
    limit?: number;
    includeInactive?: boolean; // For admin use
  }) {
    const where: any = {
      deletedAt: null,
    };

    // Only filter by isActive if not explicitly including inactive products
    if (!filters?.includeInactive) {
      where.isActive = true;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // Create cache key based on filters
    const cacheKey = `products:${JSON.stringify({ where, page, limit })}`;
    
    // Try to get from cache (only for active products, not admin queries)
    if (!filters?.includeInactive) {
      try {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          console.log('📦 Cache HIT:', cacheKey.substring(0, 50) + '...');
          return cached;
        }
      } catch (error) {
        console.warn('⚠️  Cache get error:', error.message);
      }
    }

    // Debug logging
    console.log('[ProductsService] Query where:', JSON.stringify(where, null, 2));
    console.log('[ProductsService] Pagination:', { page, limit, skip });
    console.log('💾 Cache MISS:', cacheKey.substring(0, 50) + '...');

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          inventory: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    console.log('[ProductsService] Found products:', products.length, 'Total:', total);

    const result = {
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      // Keep meta for backward compatibility
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Store in cache for 5 minutes (only for active products)
    if (!filters?.includeInactive) {
      try {
        await this.cacheManager.set(cacheKey, result, 300000); // 5 minutes in ms
      } catch (error) {
        console.warn('⚠️  Cache set error:', error.message);
      }
    }

    return result;
  }

  async findOne(id: string) {
    const cacheKey = `product:${id}`;
    
    // Try to get from cache
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        console.log('📦 Cache HIT:', cacheKey);
        return cached;
      }
    } catch (error) {
      console.warn('⚠️  Cache get error:', error.message);
    }

    console.log('💾 Cache MISS:', cacheKey);

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        inventory: true,
      },
    });

    if (!product || !product.isActive || product.deletedAt) {
      throw new NotFoundException('Product not found');
    }

    // Store in cache for 5 minutes
    try {
      await this.cacheManager.set(cacheKey, product, 300000);
    } catch (error) {
      console.warn('⚠️  Cache set error:', error.message);
    }

    return product;
  }

  async findBySlug(slug: string) {
    const cacheKey = `product:slug:${slug}`;
    
    // Try to get from cache
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        console.log('📦 Cache HIT:', cacheKey);
        return cached;
      }
    } catch (error) {
      console.warn('⚠️  Cache get error:', error.message);
    }

    console.log('💾 Cache MISS:', cacheKey);

    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        inventory: true,
      },
    });

    if (!product || !product.isActive || product.deletedAt) {
      throw new NotFoundException('Product not found');
    }

    // Store in cache for 5 minutes
    try {
      await this.cacheManager.set(cacheKey, product, 300000);
    } catch (error) {
      console.warn('⚠️  Cache set error:', error.message);
    }

    return product;
  }

  // Helper method to clear product caches
  private async clearProductCache(productId?: string, slug?: string) {
    try {
      if (productId) {
        await this.cacheManager.del(`product:${productId}`);
      }
      if (slug) {
        await this.cacheManager.del(`product:slug:${slug}`);
      }
      // Note: In production, you'd want to clear all products:* keys
      // This requires Redis SCAN or using a cache store that supports pattern deletion
      console.log('🗑️  Product cache cleared');
    } catch (error) {
      console.warn('⚠️  Cache clear error:', error.message);
    }
  }

  async getFeatured(limit = 8) {
    return this.prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        deletedAt: null,
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        inventory: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
