import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskLevel } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async getAllCustomers(filters?: {
    search?: string;
    riskLevel?: RiskLevel;
    isBlocked?: boolean;
    page?: number;
    limit?: number;
    tenantId?: string;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'CUSTOMER',
      isGuest: false,
      ...(filters?.tenantId && { tenantId: filters.tenantId }),
    };

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.isBlocked !== undefined) {
      where.customerProfile = {
        isBlocked: filters.isBlocked,
      };
    }

    if (filters?.riskLevel) {
      where.customerProfile = {
        ...where.customerProfile,
        riskLevel: filters.riskLevel,
      };
    }

    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          customerProfile: true,
          _count: {
            select: {
              orders: true,
              addresses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(id: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: true,
        addresses: {
          include: {
            deliveryZone: true,
          },
        },
        orders: {
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
            deliverySlot: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate risk score
    const riskScore = await this.calculateRiskScore(id);

    return {
      ...customer,
      riskScore,
    };
  }

  async updateCustomerRisk(id: string, data: {
    riskLevel?: RiskLevel;
    isBlocked?: boolean;
    blockedReason?: string;
    adminNotes?: string;
    tags?: string[];
  }, adminId: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id },
      include: { customerProfile: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Create profile if it doesn't exist
    if (!customer.customerProfile) {
      await this.prisma.customerProfile.create({
        data: {
          userId: id,
        },
      });
    }

    const updateData: any = {};

    if (data.riskLevel !== undefined) {
      updateData.riskLevel = data.riskLevel;
    }

    if (data.isBlocked !== undefined) {
      updateData.isBlocked = data.isBlocked;
      if (data.isBlocked) {
        updateData.blockedAt = new Date();
        updateData.blockedBy = adminId;
        updateData.blockedReason = data.blockedReason || 'No reason provided';
      } else {
        updateData.blockedAt = null;
        updateData.blockedBy = null;
        updateData.blockedReason = null;
      }
    }

    if (data.adminNotes !== undefined) {
      updateData.adminNotes = data.adminNotes;
    }

    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }

    return this.prisma.customerProfile.upsert({
      where: { userId: id },
      update: updateData,
      create: {
        userId: id,
        ...updateData,
      },
      include: {
        user: true,
      },
    });
  }

  async calculateRiskScore(userId: string): Promise<{
    score: number;
    level: RiskLevel;
    factors: string[];
  }> {
    const customer = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        orders: {
          select: {
            status: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    let score = 0;
    const factors: string[] = [];

    const profile = customer.customerProfile;
    const orders = customer.orders;

    // Factor 1: Cancelled orders ratio
    const totalOrders = orders.length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
    if (totalOrders > 0) {
      const cancelRate = cancelledOrders / totalOrders;
      if (cancelRate > 0.3) {
        score += 30;
        factors.push(`High cancellation rate: ${(cancelRate * 100).toFixed(0)}%`);
      } else if (cancelRate > 0.15) {
        score += 15;
        factors.push(`Moderate cancellation rate: ${(cancelRate * 100).toFixed(0)}%`);
      }
    }

    // Factor 2: Refunded orders
    const refundedOrders = orders.filter(o => o.status === 'REFUNDED').length;
    if (refundedOrders > 2) {
      score += 20;
      factors.push(`${refundedOrders} refunded orders`);
    } else if (refundedOrders > 0) {
      score += 10;
      factors.push(`${refundedOrders} refunded order(s)`);
    }

    // Factor 4: Account age (newer = higher risk)
    const accountAge = Date.now() - customer.createdAt.getTime();
    const daysOld = accountAge / (1000 * 60 * 60 * 24);
    if (daysOld < 7) {
      score += 20;
      factors.push('New account (< 7 days)');
    } else if (daysOld < 30) {
      score += 10;
      factors.push('Recent account (< 30 days)');
    }

    // Factor 5: Order frequency anomalies
    if (totalOrders > 10) {
      const recentOrders = orders.filter(o => {
        const orderAge = Date.now() - o.createdAt.getTime();
        return orderAge < 7 * 24 * 60 * 60 * 1000; // Last 7 days
      }).length;
      
      if (recentOrders > 5) {
        score += 15;
        factors.push(`${recentOrders} orders in last 7 days`);
      }
    }

    // Factor 6: Manual admin flags
    if (profile?.isBlocked) {
      score += 50;
      factors.push('Manually blocked by admin');
    }

    // Determine risk level
    let level: RiskLevel;
    if (score >= 70) {
      level = 'CRITICAL';
    } else if (score >= 45) {
      level = 'HIGH';
    } else if (score >= 25) {
      level = 'MEDIUM';
    } else {
      level = 'LOW';
    }

    // Auto-update risk level in profile
    if (profile) {
      await this.prisma.customerProfile.update({
        where: { userId },
        data: { riskLevel: level },
      });
    }

    return {
      score,
      level,
      factors,
    };
  }

  async updateCustomerMetrics(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      select: {
        total: true,
        status: true,
        createdAt: true,
      },
    });

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter(o => o.status === 'COLLECTED' || o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.total), 0);
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
    const returnedOrders = orders.filter(o => o.status === 'REFUNDED').length;
    const lastOrder = orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    await this.prisma.customerProfile.upsert({
      where: { userId },
      update: {
        totalOrders,
        totalSpent,
        cancelledOrders,
        returnedOrders,
        lastOrderDate: lastOrder?.createdAt,
      },
      create: {
        userId,
        totalOrders,
        totalSpent,
        cancelledOrders,
        returnedOrders,
        lastOrderDate: lastOrder?.createdAt,
      },
    });
  }

  async getCustomerStats(tenantId?: string) {
    const [
      totalCustomers,
      activeCustomers,
      blockedCustomers,
      highRiskCustomers,
      newCustomersThisMonth,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: 'CUSTOMER', isGuest: false, ...(tenantId && { tenantId }) },
      }),
      this.prisma.user.count({
        where: {
          role: 'CUSTOMER',
          isGuest: false,
          isActive: true,
          ...(tenantId && { tenantId }),
        },
      }),
      this.prisma.customerProfile.count({
        where: { isBlocked: true },
      }),
      this.prisma.customerProfile.count({
        where: {
          riskLevel: {
            in: ['HIGH', 'CRITICAL'],
          },
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'CUSTOMER',
          isGuest: false,
          ...(tenantId && { tenantId }),
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      blockedCustomers,
      highRiskCustomers,
      newCustomersThisMonth,
    };
  }
}
