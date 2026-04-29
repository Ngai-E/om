import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from './entitlements.service';

/**
 * UsageService - Tracks and enforces usage limits
 * 
 * Responsibilities:
 * - Check current usage against limits
 * - Enforce usage limits before allowing actions
 * - Provide usage statistics
 */
@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private prisma: PrismaService,
    private entitlementsService: EntitlementsService,
  ) {}

  /**
   * Check if tenant can add more products
   */
  async canAddProduct(tenantId: string): Promise<boolean> {
    const limit = await this.entitlementsService.getLimit(tenantId, 'products_max');
    
    if (limit === null) {
      // No limit defined, allow unlimited
      return true;
    }

    const currentCount = await this.prisma.product.count({
      where: { tenantId, deletedAt: null },
    });

    return currentCount < limit;
  }

  /**
   * Check if tenant can add more staff members
   */
  async canAddStaff(tenantId: string): Promise<boolean> {
    const limit = await this.entitlementsService.getLimit(tenantId, 'staff_max');
    
    if (limit === null) {
      // No limit defined, allow unlimited
      return true;
    }

    const currentCount = await this.prisma.user.count({
      where: { 
        tenantId,
        role: { in: ['STAFF', 'ADMIN'] },
      },
    });

    return currentCount < limit;
  }

  /**
   * Enforce product limit before creation
   */
  async enforceProductLimit(tenantId: string): Promise<void> {
    const canAdd = await this.canAddProduct(tenantId);
    
    if (!canAdd) {
      const limit = await this.entitlementsService.getLimit(tenantId, 'products_max');
      throw new ForbiddenException(
        `Product limit reached. Your plan allows up to ${limit} products. Please upgrade to add more.`
      );
    }
  }

  /**
   * Enforce staff limit before creation
   */
  async enforceStaffLimit(tenantId: string): Promise<void> {
    const canAdd = await this.canAddStaff(tenantId);
    
    if (!canAdd) {
      const limit = await this.entitlementsService.getLimit(tenantId, 'staff_max');
      throw new ForbiddenException(
        `Staff limit reached. Your plan allows up to ${limit} staff members. Please upgrade to add more.`
      );
    }
  }

  /**
   * Get usage statistics for a tenant
   */
  async getUsageStats(tenantId: string) {
    try {
      const [
        productsCount,
        staffCount,
        ordersCount,
        customersCount,
        productsLimit,
        staffLimit,
      ] = await Promise.all([
        this.prisma.product.count({ where: { tenantId, deletedAt: null } }),
        this.prisma.user.count({ where: { tenantId, role: { in: ['STAFF', 'ADMIN'] } } }),
        this.prisma.order.count({ where: { tenantId } }),
        this.prisma.user.count({ where: { tenantId, role: 'CUSTOMER' } }),
        this.entitlementsService.getLimit(tenantId, 'products_max'),
        this.entitlementsService.getLimit(tenantId, 'staff_max'),
      ]);

      return {
        products: {
          current: productsCount,
          limit: productsLimit,
          percentage: productsLimit ? Math.round((productsCount / productsLimit) * 100) : 0,
        },
        staff: {
          current: staffCount,
          limit: staffLimit,
          percentage: staffLimit ? Math.round((staffCount / staffLimit) * 100) : 0,
        },
        orders: {
          total: ordersCount,
        },
        customers: {
          total: customersCount,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting usage stats for tenant ${tenantId}`, error);
      throw error;
    }
  }

  /**
   * Check if a feature is enabled for the tenant
   */
  async requireFeature(tenantId: string, featureKey: string): Promise<void> {
    const hasAccess = await this.entitlementsService.hasFeature(tenantId, featureKey);
    
    if (!hasAccess) {
      throw new ForbiddenException(
        `This feature (${featureKey}) is not available on your current plan. Please upgrade to access it.`
      );
    }
  }
}
