import { FulfillmentType } from '@prisma/client';

export interface OrderContext {
  userId?: string;
  subtotal: number;
  deliveryFee: number;
  fulfillmentType: FulfillmentType;
  isFirstOrder: boolean;
  isGuest: boolean;
  promoCode?: string;
}

export interface PromotionEvaluationResult {
  applicable: boolean;
  reason?: string;
  calculatedDiscount?: number;
  appliedToSubtotal?: number;
  appliedToDelivery?: number;
}

export interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  code?: string;
  discountAmount: number;
  appliedToSubtotal: number;
  appliedToDelivery: number;
}

export interface PromotionApplicationResult {
  totalDiscount: number;
  redemptions: AppliedPromotion[];
  messages: string[];
}

export interface PromotionStats {
  totalRedemptions: number;
  totalDiscountGiven: number;
  remainingBudgetAmount?: number;
  remainingBudgetUses?: number;
  percentUsed: number;
}
