-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('NONE', 'TOTAL_DISCOUNT', 'TOTAL_USES', 'BOTH');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "discountTotal" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "code" TEXT,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "budgetType" "BudgetType" NOT NULL DEFAULT 'NONE',
    "maxTotalDiscountAmount" DECIMAL(10,2),
    "maxTotalRedemptions" INTEGER,
    "maxRedemptionsPerUser" INTEGER,
    "minSubtotal" DECIMAL(10,2),
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "allowedFulfillment" "FulfillmentType",
    "allowGuests" BOOLEAN NOT NULL DEFAULT true,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "maxDiscountPerOrder" DECIMAL(10,2),
    "applyToSubtotal" BOOLEAN NOT NULL DEFAULT true,
    "applyToDeliveryFee" BOOLEAN NOT NULL DEFAULT false,
    "allowStacking" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_redemptions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "appliedToSubtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "appliedToDelivery" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_status_idx" ON "promotions"("status");

-- CreateIndex
CREATE INDEX "promotions_code_idx" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_startAt_endAt_idx" ON "promotions"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "promotion_redemptions_promotionId_idx" ON "promotion_redemptions"("promotionId");

-- CreateIndex
CREATE INDEX "promotion_redemptions_orderId_idx" ON "promotion_redemptions"("orderId");

-- CreateIndex
CREATE INDEX "promotion_redemptions_userId_idx" ON "promotion_redemptions"("userId");

-- CreateIndex
CREATE INDEX "promotion_redemptions_createdAt_idx" ON "promotion_redemptions"("createdAt");

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
