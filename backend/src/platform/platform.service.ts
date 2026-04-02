import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PlatformService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // PLATFORM CONFIGURATION
  // ============================================

  async getPlatformConfig(key: string): Promise<string | null> {
    const config = await this.prisma.platformConfig.findUnique({
      where: { key },
    });
    return config?.value || null;
  }

  async getAllPlatformConfig(): Promise<Record<string, string>> {
    const configs = await this.prisma.platformConfig.findMany();
    const result: Record<string, string> = {};
    configs.forEach(config => {
      result[config.key] = config.value;
    });
    return result;
  }

  async setPlatformConfig(
    key: string, 
    value: string, 
    description?: string,
    isEncrypted = false,
    updatedBy?: string
  ): Promise<void> {
    await this.prisma.platformConfig.upsert({
      where: { key },
      update: { 
        value, 
        description, 
        isEncrypted, 
        updatedAt: new Date(),
        updatedBy 
      },
      create: { 
        key, 
        value, 
        description, 
        isEncrypted,
        updatedBy 
      },
    });
  }

  async deletePlatformConfig(key: string): Promise<void> {
    await this.prisma.platformConfig.delete({
      where: { key },
    });
  }

  // ============================================
  // TENANT BALANCES
  // ============================================

  async getTenantBalance(tenantId: string) {
    return await this.prisma.tenantBalance.findUnique({
      where: { tenantId },
      include: {
        tenant: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async getAllTenantBalances() {
    return await this.prisma.tenantBalance.findMany({
      include: {
        tenant: {
          select: { name: true, email: true, status: true },
        },
      },
      orderBy: {
        currentBalance: 'desc',
      },
    });
  }

  async updateTenantBalance(
    tenantId: string,
    amount: Decimal,
    grossAmount?: Decimal,
    platformFee?: Decimal,
    taxAmount?: Decimal
  ): Promise<void> {
    // Get current balance or create if doesn't exist
    const current = await this.prisma.tenantBalance.findUnique({
      where: { tenantId },
    });

    if (current) {
      await this.prisma.tenantBalance.update({
        where: { tenantId },
        data: {
          currentBalance: new Decimal(current.currentBalance).add(amount),
          totalEarned: new Decimal(current.totalEarned).add(grossAmount || amount),
          totalPlatformFees: new Decimal(current.totalPlatformFees).add(platformFee || 0),
          totalTaxes: new Decimal(current.totalTaxes).add(taxAmount || 0),
          lastUpdated: new Date(),
        },
      });
    } else {
      await this.prisma.tenantBalance.create({
        data: {
          tenantId,
          currentBalance: amount,
          totalEarned: grossAmount || amount,
          totalPlatformFees: platformFee || 0,
          totalTaxes: taxAmount || 0,
        },
      });
    }
  }

  async deductFromBalance(tenantId: string, amount: Decimal): Promise<void> {
    const current = await this.prisma.tenantBalance.findUnique({
      where: { tenantId },
    });

    if (!current) {
      throw new Error('No balance found for tenant');
    }

    if (new Decimal(current.currentBalance).lt(amount)) {
      throw new Error('Insufficient balance');
    }

    await this.prisma.tenantBalance.update({
      where: { tenantId },
      data: {
        currentBalance: new Decimal(current.currentBalance).sub(amount),
        totalWithdrawn: new Decimal(current.totalWithdrawn).add(amount),
        lastUpdated: new Date(),
        lastPayoutAt: new Date(),
      },
    });
  }

  // ============================================
  // PAYOUTS
  // ============================================

  async createPayout(data: {
    tenantId: string;
    amount: Decimal;
    grossAmount?: Decimal;
    platformFee?: Decimal;
    taxAmount?: Decimal;
    paymentMethod: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankSortCode?: string;
    reference?: string;
    notes?: string;
    processedBy?: string;
  }) {
    const netAmount = data.grossAmount 
      ? new Decimal(data.grossAmount).sub(data.platformFee || 0).sub(data.taxAmount || 0)
      : data.amount;

    return await this.prisma.tenantPayout.create({
      data: {
        tenantId: data.tenantId,
        amount: data.amount,
        grossAmount: data.grossAmount || data.amount,
        platformFee: data.platformFee || 0,
        taxAmount: data.taxAmount || 0,
        netAmount,
        paymentMethod: data.paymentMethod,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankSortCode: data.bankSortCode,
        reference: data.reference,
        notes: data.notes,
        processedBy: data.processedBy,
      },
      include: {
        tenant: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async getPayouts(tenantId?: string, status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;

    const [payouts, total] = await Promise.all([
      this.prisma.tenantPayout.findMany({
        where,
        include: {
          tenant: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenantPayout.count({ where }),
    ]);

    return {
      payouts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updatePayoutStatus(
    payoutId: string,
    status: string,
    processedBy?: string,
    stripePayoutId?: string
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'COMPLETED') {
      updateData.processedAt = new Date();
      updateData.processedBy = processedBy;
      
      // Deduct from tenant balance
      const payout = await this.prisma.tenantPayout.findUnique({
        where: { id: payoutId },
      });
      
      if (payout && payout.status === 'PENDING') {
        await this.deductFromBalance(payout.tenantId, payout.amount);
      }
    }

    if (stripePayoutId) {
      updateData.stripePayoutId = stripePayoutId;
    }

    return await this.prisma.tenantPayout.update({
      where: { id: payoutId },
      data: updateData,
      include: {
        tenant: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async getPayoutStats() {
    const [pending, processing, completed, failed, totalAmount] = await Promise.all([
      this.prisma.tenantPayout.count({ where: { status: 'PENDING' } }),
      this.prisma.tenantPayout.count({ where: { status: 'PROCESSING' } }),
      this.prisma.tenantPayout.count({ where: { status: 'COMPLETED' } }),
      this.prisma.tenantPayout.count({ where: { status: 'FAILED' } }),
      this.prisma.tenantPayout.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      totalPaidOut: totalAmount._sum.amount || new Decimal(0),
    };
  }

  // ============================================
  // PLATFORM FEES & TAXES
  // ============================================

  async getPlatformFees() {
    const defaultFees = {
      platformFeePercent: new Decimal('5'), // 5% platform fee
      taxPercent: new Decimal('0'), // 0% tax (adjust based on jurisdiction)
      minimumPayout: new Decimal('50'), // £50 minimum payout
      payoutSchedule: 'weekly', // weekly, biweekly, monthly
    };

    const fees = await this.prisma.platformConfig.findMany({
      where: {
        key: {
          in: ['platform_fee_percent', 'tax_percent', 'minimum_payout', 'payout_schedule'],
        },
      },
    });

    const result: any = { ...defaultFees };
    fees.forEach(fee => {
      const key = fee.key.replace(/_(.)/g, (_, char) => char.toUpperCase());
      if (key.includes('Percent')) {
        result[key] = new Decimal(fee.value);
      } else {
        result[key] = fee.value;
      }
    });

    return result;
  }

  async updatePlatformFees(fees: {
    platformFeePercent?: Decimal;
    taxPercent?: Decimal;
    minimumPayout?: Decimal;
    payoutSchedule?: string;
  }, updatedBy?: string) {
    for (const [key, value] of Object.entries(fees)) {
      if (value !== undefined) {
        const configKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        await this.setPlatformConfig(
          configKey,
          value.toString(),
          `Platform fee configuration`,
          false,
          updatedBy
        );
      }
    }
  }

  // ============================================
  // AUTOMATIC BALANCE UPDATES FROM ORDERS
  // ============================================

  async processOrderPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order || !order.payment || order.payment.status !== 'SUCCEEDED') {
      return;
    }

    if (!order.tenantId) {
      return; // Skip orders without tenant
    }

    const fees = await this.getPlatformFees();
    const grossAmount = order.total;
    const platformFee = grossAmount.mul(fees.platformFeePercent).div(100);
    const taxAmount = grossAmount.mul(fees.taxPercent).div(100);
    const netAmount = grossAmount.sub(platformFee).sub(taxAmount);

    // Update tenant balance
    await this.updateTenantBalance(
      order.tenantId,
      netAmount,
      grossAmount,
      platformFee,
      taxAmount
    );
  }
}
