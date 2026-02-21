import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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

    // Debug logging
    console.log('[ProductsService] Query where:', JSON.stringify(where, null, 2));
    console.log('[ProductsService] Pagination:', { page, limit, skip });

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

    return {
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
  }

  async findOne(id: string) {
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

    return product;
  }

  async findBySlug(slug: string) {
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

    return product;
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
