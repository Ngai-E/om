import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * PlatformAdminService - Super admin operations with audit logging
 * 
 * All operations write to PlatformAuditLog for compliance and tracking
 */
@Injectable()
export class PlatformAdminService {
  private readonly logger = new Logger(PlatformAdminService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Write audit log entry
   */
  private async writeAuditLog(
    action: string,
    targetType: string,
    targetId: string | null,
    actorUserId: string,
    metadata?: any,
  ) {
    try {
      await this.prisma.platformAuditLog.create({
        data: {
          action,
          targetType,
          targetId,
          actorUserId,
          metadata: metadata || {},
        },
      });
    } catch (error) {
      this.logger.error('Failed to write audit log', error);
    }
  }

  /**
   * List all tenants with filtering
   */
  async listTenants(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }, actorUserId: string) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          subscriptions: {
            where: { status: { in: ['TRIALING', 'ACTIVE'] } },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              users: true,
              products: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    await this.writeAuditLog('LIST_TENANTS', 'Tenant', null, actorUserId, { filters });

    return {
      data: tenants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detailed tenant information
   */
  async getTenantDetails(tenantId: string, actorUserId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branding: true,
        domains: true,
        subscriptions: {
          include: { plan: { include: { entitlements: true } } },
          orderBy: { createdAt: 'desc' },
        },
        onboarding: true,
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
            categories: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.writeAuditLog('VIEW_TENANT', 'Tenant', tenantId, actorUserId);

    return tenant;
  }

  /**
   * Suspend a tenant
   */
  async suspendTenant(tenantId: string, reason: string, actorUserId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status === 'SUSPENDED') {
      throw new BadRequestException('Tenant is already suspended');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'SUSPENDED' },
    });

    await this.writeAuditLog('SUSPEND_TENANT', 'Tenant', tenantId, actorUserId, {
      reason,
      previousStatus: tenant.status,
    });

    this.logger.warn(`Tenant suspended: ${tenant.slug} by user ${actorUserId}. Reason: ${reason}`);

    return { success: true, tenant: updated };
  }

  /**
   * Activate a suspended tenant
   */
  async activateTenant(tenantId: string, actorUserId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'ACTIVE' },
    });

    await this.writeAuditLog('ACTIVATE_TENANT', 'Tenant', tenantId, actorUserId, {
      previousStatus: tenant.status,
    });

    this.logger.log(`Tenant activated: ${tenant.slug} by user ${actorUserId}`);

    return { success: true, tenant: updated };
  }

  /**
   * Permanently disable a tenant
   */
  async disableTenant(tenantId: string, reason: string, actorUserId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'DISABLED' },
    });

    await this.writeAuditLog('DISABLE_TENANT', 'Tenant', tenantId, actorUserId, {
      reason,
      previousStatus: tenant.status,
    });

    this.logger.warn(`Tenant disabled: ${tenant.slug} by user ${actorUserId}. Reason: ${reason}`);

    return { success: true, tenant: updated };
  }

  /**
   * Change tenant's subscription plan
   */
  async changePlan(tenantId: string, planCode: string, reason: string, actorUserId: string) {
    const [tenant, newPlan] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.plan.findFirst({ where: { code: planCode, isActive: true } }),
    ]);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    // Get current subscription
    const currentSubscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: { in: ['TRIALING', 'ACTIVE'] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    // Cancel current subscription
    if (currentSubscription) {
      await this.prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: { 
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });
    }

    // Create new subscription
    const newSubscription = await this.prisma.subscription.create({
      data: {
        tenantId,
        planId: newPlan.id,
        status: 'ACTIVE',
        currentPeriodStartsAt: new Date(),
        currentPeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: { plan: true },
    });

    await this.writeAuditLog('CHANGE_PLAN', 'Subscription', newSubscription.id, actorUserId, {
      reason,
      tenantId,
      oldPlanCode: currentSubscription?.plan.code,
      newPlanCode: planCode,
    });

    this.logger.log(`Plan changed for tenant ${tenant.slug}: ${currentSubscription?.plan.code} → ${planCode}`);

    return { success: true, subscription: newSubscription };
  }

  /**
   * Extend trial period
   */
  async extendTrial(tenantId: string, days: number, reason: string, actorUserId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: 'TRIALING',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new BadRequestException('No active trial found for this tenant');
    }

    const currentTrialEnd = subscription.trialEndsAt || new Date();
    const newTrialEnd = new Date(currentTrialEnd.getTime() + days * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { trialEndsAt: newTrialEnd },
    });

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { trialEndsAt: newTrialEnd },
    });

    await this.writeAuditLog('EXTEND_TRIAL', 'Subscription', subscription.id, actorUserId, {
      reason,
      tenantId,
      daysAdded: days,
      oldTrialEnd: currentTrialEnd,
      newTrialEnd,
    });

    this.logger.log(`Trial extended for tenant ${tenant.slug}: +${days} days`);

    return { success: true, subscription: updated };
  }

  /**
   * Get platform overview statistics
   */
  async getOverviewStats(actorUserId: string) {
    const [
      totalTenants,
      activeTenants,
      trialingTenants,
      suspendedTenants,
      totalUsers,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'TRIALING' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'DELIVERED' },
      }),
    ]);

    await this.writeAuditLog('VIEW_PLATFORM_STATS', 'Platform', null, actorUserId);

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        trialing: trialingTenants,
        suspended: suspendedTenants,
      },
      users: {
        total: totalUsers,
      },
      orders: {
        total: totalOrders,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
      },
    };
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(period: string, actorUserId: string) {
    // Implementation would depend on your revenue tracking needs
    await this.writeAuditLog('VIEW_REVENUE_STATS', 'Platform', null, actorUserId, { period });

    return {
      period,
      message: 'Revenue stats implementation pending',
    };
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters: {
    action?: string;
    targetType?: string;
    targetId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    if (filters.targetId) {
      where.targetId = filters.targetId;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.platformAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.platformAuditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
