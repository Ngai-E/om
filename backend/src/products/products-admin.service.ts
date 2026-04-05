import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../entitlements/usage.service';

/**
 * ProductsAdminService - Handles product creation with entitlement enforcement
 * 
 * CRITICAL: Always enforces product limits before creation
 */
@Injectable()
export class ProductsAdminService {
  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
  ) {}

  /**
   * Create product with strict limit enforcement
   */
  async createProduct(tenantId: string, data: any) {
    // CRITICAL: Enforce product limit BEFORE creation
    await this.usageService.enforceProductLimit(tenantId);

    // Create product
    const product = await this.prisma.product.create({
      data: {
        ...data,
        tenantId, // ALWAYS set from context, NEVER from DTO
      },
    });

    return product;
  }

  /**
   * Check if tenant can add more products
   */
  async canAddProduct(tenantId: string): Promise<boolean> {
    return this.usageService.canAddProduct(tenantId);
  }
}
