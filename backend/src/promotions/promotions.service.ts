import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto';
import {
  OrderContext,
  PromotionEvaluationResult,
  PromotionApplicationResult,
  AppliedPromotion,
  PromotionStats,
} from './interfaces/promotion-evaluation.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async create(dto: CreatePromotionDto, adminId: string, tenantId?: string) {
    // Validate promo code uniqueness if provided
    if (dto.code) {
      const existing = await this.prisma.promotion.findFirst({
        where: { code: dto.code, ...(tenantId && { tenantId }) },
      });
      if (existing) {
        throw new BadRequestException('Promo code already exists');
      }
    }

    // Validate dates
    if (dto.startAt && dto.endAt && new Date(dto.startAt) >= new Date(dto.endAt)) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate discount value
    if (dto.discountType === 'PERCENT' && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        ...(tenantId && { tenantId }),
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        code: dto.code,
        status: dto.status,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        budgetType: dto.budgetType,
        maxTotalDiscountAmount: dto.maxTotalDiscountAmount,
        maxTotalRedemptions: dto.maxTotalRedemptions,
        maxRedemptionsPerUser: dto.maxRedemptionsPerUser,
        minSubtotal: dto.minSubtotal,
        firstOrderOnly: dto.firstOrderOnly,
        allowedFulfillment: dto.allowedFulfillment,
        allowGuests: dto.allowGuests,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxDiscountPerOrder: dto.maxDiscountPerOrder,
        applyToSubtotal: dto.applyToSubtotal,
        applyToDeliveryFee: dto.applyToDeliveryFee,
        allowStacking: dto.allowStacking,
        priority: dto.priority,
        createdBy: adminId,
      },
    });

    console.log(`✅ Promotion created: ${promotion.name} (${promotion.id})`);
    return promotion;
  }

  async findAll(filters?: {
    tenantId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters?.status) {
      where.status = filters.status as any;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: { redemptions: true },
          },
        },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    // Calculate stats for each promotion
    const promotionsWithStats = await Promise.all(
      promotions.map(async (promo) => {
        const stats = await this.getPromotionStats(promo.id);
        return {
          ...promo,
          stats,
        };
      }),
    );

    return {
      data: promotionsWithStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    const stats = await this.getPromotionStats(id);

    return {
      ...promotion,
      stats,
    };
  }

  async findActive() {
    const now = new Date();

    const promotions = await this.prisma.promotion.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { startAt: null, endAt: null },
          { startAt: { lte: now }, endAt: null },
          { startAt: null, endAt: { gte: now } },
          { startAt: { lte: now }, endAt: { gte: now } },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return promotions;
  }

  async findByCode(code: string, tenantId?: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { code, ...(tenantId && { tenantId }) },
    });

    if (!promotion) {
      throw new NotFoundException(`Promo code "${code}" not found`);
    }

    return promotion;
  }

  async getActivePromotions(tenantId?: string) {
    const promotions = await this.prisma.promotion.findMany({
      where: {
        status: 'ACTIVE',
        ...(tenantId && { tenantId }),
        OR: [
          { startAt: null },
          { startAt: { lte: new Date() } },
        ],
        AND: [
          {
            OR: [
              { endAt: null },
              { endAt: { gte: new Date() } },
            ],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return promotions;
  }

  async getEligiblePromotionsForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return [];
    }

    const isFirstOrder = user.orders.length === 0;

    const activePromotions = await this.prisma.promotion.findMany({
      where: {
        status: 'ACTIVE',
        code: { not: null },
        OR: [
          { startAt: null },
          { startAt: { lte: new Date() } },
        ],
        AND: [
          {
            OR: [
              { endAt: null },
              { endAt: { gte: new Date() } },
            ],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const eligiblePromotions = [];

    for (const promo of activePromotions) {
      if (promo.firstOrderOnly && !isFirstOrder) continue;
      if (!promo.allowGuests && !user) continue;

      if (promo.maxRedemptionsPerUser) {
        const userRedemptions = await this.prisma.promotionRedemption.count({
          where: { promotionId: promo.id, userId: userId },
        });
        if (userRedemptions >= promo.maxRedemptionsPerUser) continue;
      }

      if (promo.budgetType !== 'NONE') {
        const stats = await this.getPromotionStats(promo.id);
        
        if ((promo.budgetType === 'TOTAL_DISCOUNT' || promo.budgetType === 'BOTH') &&
            promo.maxTotalDiscountAmount && stats.totalDiscountGiven >= Number(promo.maxTotalDiscountAmount)) {
          continue;
        }

        if ((promo.budgetType === 'TOTAL_USES' || promo.budgetType === 'BOTH') &&
            promo.maxTotalRedemptions && stats.totalRedemptions >= promo.maxTotalRedemptions) {
          continue;
        }
      }

      eligiblePromotions.push(promo);
    }

    return eligiblePromotions;
  }

  async update(id: string, dto: UpdatePromotionDto, adminId: string, tenantId?: string) {
    const existing = await this.findOne(id);

    // Validate promo code uniqueness if changed
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await this.prisma.promotion.findFirst({
        where: { code: dto.code, ...(tenantId && { tenantId }) },
      });
      if (codeExists) {
        throw new BadRequestException('Promo code already exists');
      }
    }

    // Validate dates
    if (dto.startAt && dto.endAt && new Date(dto.startAt) >= new Date(dto.endAt)) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate discount value
    if (dto.discountType === 'PERCENT' && dto.discountValue && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const updated = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.status && { status: dto.status }),
        ...(dto.startAt !== undefined && { startAt: dto.startAt ? new Date(dto.startAt) : null }),
        ...(dto.endAt !== undefined && { endAt: dto.endAt ? new Date(dto.endAt) : null }),
        ...(dto.budgetType && { budgetType: dto.budgetType }),
        ...(dto.maxTotalDiscountAmount !== undefined && { maxTotalDiscountAmount: dto.maxTotalDiscountAmount }),
        ...(dto.maxTotalRedemptions !== undefined && { maxTotalRedemptions: dto.maxTotalRedemptions }),
        ...(dto.maxRedemptionsPerUser !== undefined && { maxRedemptionsPerUser: dto.maxRedemptionsPerUser }),
        ...(dto.minSubtotal !== undefined && { minSubtotal: dto.minSubtotal }),
        ...(dto.firstOrderOnly !== undefined && { firstOrderOnly: dto.firstOrderOnly }),
        ...(dto.allowedFulfillment !== undefined && { allowedFulfillment: dto.allowedFulfillment }),
        ...(dto.allowGuests !== undefined && { allowGuests: dto.allowGuests }),
        ...(dto.discountType && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.maxDiscountPerOrder !== undefined && { maxDiscountPerOrder: dto.maxDiscountPerOrder }),
        ...(dto.applyToSubtotal !== undefined && { applyToSubtotal: dto.applyToSubtotal }),
        ...(dto.applyToDeliveryFee !== undefined && { applyToDeliveryFee: dto.applyToDeliveryFee }),
        ...(dto.allowStacking !== undefined && { allowStacking: dto.allowStacking }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.usageCount !== undefined && { usageCount: dto.usageCount }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
      },
    });

    console.log(`✅ Promotion updated: ${updated.name} (${updated.id})`);
    return updated;
  }

  async delete(id: string, adminId: string) {
    await this.findOne(id);

    await this.prisma.promotion.delete({
      where: { id },
    });

    console.log(`🗑️  Promotion deleted: ${id}`);
    return { message: 'Promotion deleted successfully' };
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  async activate(id: string, adminId: string) {
    const promotion = await this.update(id, { status: 'ACTIVE' as any }, adminId);
    console.log(`✅ Promotion activated: ${promotion.name}`);
    return promotion;
  }

  async pause(id: string, adminId: string) {
    const promotion = await this.update(id, { status: 'PAUSED' as any }, adminId);
    console.log(`⏸️  Promotion paused: ${promotion.name}`);
    return promotion;
  }

  async end(id: string, adminId: string) {
    const promotion = await this.update(id, { status: 'ENDED' as any }, adminId);
    console.log(`🏁 Promotion ended: ${promotion.name}`);
    return promotion;
  }

  // ============================================
  // EVALUATION ENGINE
  // ============================================

  async applyPromotions(context: OrderContext): Promise<PromotionApplicationResult> {
    const activePromotions = await this.findActive();
    const applicablePromotions: AppliedPromotion[] = [];
    const messages: string[] = [];

    // Filter by promo code if provided
    let promotionsToEvaluate = activePromotions;
    if (context.promoCode) {
      const codePromo = activePromotions.find((p) => p.code === context.promoCode);
      if (!codePromo) {
        return {
          totalDiscount: 0,
          redemptions: [],
          messages: ['Invalid promo code'],
        };
      }
      promotionsToEvaluate = [codePromo];
    } else {
      // Only automatic promotions (no code required)
      promotionsToEvaluate = activePromotions.filter((p) => !p.code);
    }

    // Sort by priority (highest first)
    promotionsToEvaluate.sort((a, b) => b.priority - a.priority);

    for (const promotion of promotionsToEvaluate) {
      const evaluation = await this.evaluatePromotion(promotion, context);

      if (evaluation.applicable) {
        applicablePromotions.push({
          promotionId: promotion.id,
          promotionName: promotion.name,
          code: promotion.code || undefined,
          discountAmount: evaluation.calculatedDiscount!,
          appliedToSubtotal: evaluation.appliedToSubtotal!,
          appliedToDelivery: evaluation.appliedToDelivery!,
        });

        messages.push(`Applied: ${promotion.name} (-£${evaluation.calculatedDiscount!.toFixed(2)})`);

        // If stacking not allowed, stop after first applicable promotion
        if (!promotion.allowStacking) {
          break;
        }
      } else if (evaluation.reason) {
        messages.push(evaluation.reason);
      }
    }

    const totalDiscount = applicablePromotions.reduce((sum, p) => sum + p.discountAmount, 0);

    return {
      totalDiscount,
      redemptions: applicablePromotions,
      messages,
    };
  }

  private async evaluatePromotion(
    promotion: any,
    context: OrderContext,
  ): Promise<PromotionEvaluationResult> {
    // Check if promotion is within date range
    const now = new Date();
    if (promotion.startAt && new Date(promotion.startAt) > now) {
      return { applicable: false, reason: `${promotion.name} has not started yet` };
    }
    if (promotion.endAt && new Date(promotion.endAt) < now) {
      return { applicable: false, reason: `${promotion.name} has expired` };
    }

    // Check guest eligibility
    if (context.isGuest && !promotion.allowGuests) {
      return { applicable: false, reason: `${promotion.name} is not available for guest checkout` };
    }

    // Check first order requirement
    if (promotion.firstOrderOnly && !context.isFirstOrder) {
      return { applicable: false, reason: `${promotion.name} is for first orders only` };
    }

    // Check minimum subtotal
    if (promotion.minSubtotal && context.subtotal < Number(promotion.minSubtotal)) {
      const needed = Number(promotion.minSubtotal) - context.subtotal;
      return {
        applicable: false,
        reason: `Add £${needed.toFixed(2)} more to qualify for ${promotion.name}`,
      };
    }

    // Check fulfillment type
    if (promotion.allowedFulfillment && promotion.allowedFulfillment !== context.fulfillmentType) {
      return {
        applicable: false,
        reason: `${promotion.name} is only for ${promotion.allowedFulfillment.toLowerCase()} orders`,
      };
    }

    // Check budget constraints
    const budgetCheck = await this.validateBudget(promotion, context.userId);
    if (!budgetCheck.valid) {
      return { applicable: false, reason: budgetCheck.reason };
    }

    // Calculate discount
    const discount = this.calculateDiscount(promotion, context);

    return {
      applicable: true,
      calculatedDiscount: discount.total,
      appliedToSubtotal: discount.subtotal,
      appliedToDelivery: discount.delivery,
    };
  }

  private calculateDiscount(
    promotion: any,
    context: OrderContext,
  ): { total: number; subtotal: number; delivery: number } {
    let subtotalDiscount = 0;
    let deliveryDiscount = 0;

    // Calculate base discount
    if (promotion.discountType === 'PERCENT') {
      const percentValue = Number(promotion.discountValue) / 100;

      if (promotion.applyToSubtotal) {
        subtotalDiscount = context.subtotal * percentValue;
      }

      if (promotion.applyToDeliveryFee) {
        deliveryDiscount = context.deliveryFee * percentValue;
      }
    } else {
      // FIXED discount
      const fixedAmount = Number(promotion.discountValue);

      if (promotion.applyToSubtotal && promotion.applyToDeliveryFee) {
        // Split between both
        const total = context.subtotal + context.deliveryFee;
        const subtotalRatio = context.subtotal / total;
        subtotalDiscount = fixedAmount * subtotalRatio;
        deliveryDiscount = fixedAmount * (1 - subtotalRatio);
      } else if (promotion.applyToSubtotal) {
        subtotalDiscount = Math.min(fixedAmount, context.subtotal);
      } else if (promotion.applyToDeliveryFee) {
        deliveryDiscount = Math.min(fixedAmount, context.deliveryFee);
      }
    }

    // Apply max discount cap if set
    let totalDiscount = subtotalDiscount + deliveryDiscount;
    if (promotion.maxDiscountPerOrder && totalDiscount > Number(promotion.maxDiscountPerOrder)) {
      const ratio = Number(promotion.maxDiscountPerOrder) / totalDiscount;
      subtotalDiscount *= ratio;
      deliveryDiscount *= ratio;
      totalDiscount = Number(promotion.maxDiscountPerOrder);
    }

    // Ensure discounts don't exceed original amounts
    subtotalDiscount = Math.min(subtotalDiscount, context.subtotal);
    deliveryDiscount = Math.min(deliveryDiscount, context.deliveryFee);

    return {
      total: subtotalDiscount + deliveryDiscount,
      subtotal: subtotalDiscount,
      delivery: deliveryDiscount,
    };
  }

  private async validateBudget(
    promotion: any,
    userId?: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    if (promotion.budgetType === 'NONE') {
      return { valid: true };
    }

    const stats = await this.getPromotionStats(promotion.id);

    // Check total discount amount budget
    if (
      (promotion.budgetType === 'TOTAL_DISCOUNT' || promotion.budgetType === 'BOTH') &&
      promotion.maxTotalDiscountAmount
    ) {
      if (stats.totalDiscountGiven >= Number(promotion.maxTotalDiscountAmount)) {
        return { valid: false, reason: `${promotion.name} budget has been exhausted` };
      }
    }

    // Check total redemptions budget
    if (
      (promotion.budgetType === 'TOTAL_USES' || promotion.budgetType === 'BOTH') &&
      promotion.maxTotalRedemptions
    ) {
      if (stats.totalRedemptions >= promotion.maxTotalRedemptions) {
        return { valid: false, reason: `${promotion.name} has reached maximum uses` };
      }
    }

    // Check per-user redemption limit
    if (promotion.maxRedemptionsPerUser && userId) {
      const userRedemptions = await this.prisma.promotionRedemption.count({
        where: {
          promotionId: promotion.id,
          userId,
        },
      });

      if (userRedemptions >= promotion.maxRedemptionsPerUser) {
        return {
          valid: false,
          reason: `You have already used ${promotion.name} the maximum number of times`,
        };
      }
    }

    return { valid: true };
  }

  // ============================================
  // STATS & TRACKING
  // ============================================

  async getPromotionStats(promotionId: string): Promise<PromotionStats> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    const redemptions = await this.prisma.promotionRedemption.findMany({
      where: { promotionId },
    });

    const totalRedemptions = redemptions.length;
    const totalDiscountGiven = redemptions.reduce(
      (sum, r) => sum + Number(r.discountAmount),
      0,
    );

    let remainingBudgetAmount: number | undefined;
    let remainingBudgetUses: number | undefined;
    let percentUsed = 0;

    if (promotion.maxTotalDiscountAmount) {
      remainingBudgetAmount = Number(promotion.maxTotalDiscountAmount) - totalDiscountGiven;
      percentUsed = (totalDiscountGiven / Number(promotion.maxTotalDiscountAmount)) * 100;
    }

    if (promotion.maxTotalRedemptions) {
      remainingBudgetUses = promotion.maxTotalRedemptions - totalRedemptions;
      const usesPercent = (totalRedemptions / promotion.maxTotalRedemptions) * 100;
      percentUsed = Math.max(percentUsed, usesPercent);
    }

    return {
      totalRedemptions,
      totalDiscountGiven,
      remainingBudgetAmount,
      remainingBudgetUses,
      percentUsed: Math.min(percentUsed, 100),
    };
  }

  async getRedemptions(promotionId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [redemptions, total] = await Promise.all([
      this.prisma.promotionRedemption.findMany({
        where: { promotionId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.promotionRedemption.count({ where: { promotionId } }),
    ]);

    return {
      data: redemptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async recordRedemption(
    promotionId: string,
    orderId: string,
    userId: string | null,
    discountAmount: number,
    appliedToSubtotal: number,
    appliedToDelivery: number,
  ) {
    const redemption = await this.prisma.promotionRedemption.create({
      data: {
        promotionId,
        orderId,
        userId,
        discountAmount,
        appliedToSubtotal,
        appliedToDelivery,
      },
    });

    console.log(`📊 Promotion redeemed: ${promotionId} on order ${orderId} (-£${discountAmount})`);
    return redemption;
  }
}
