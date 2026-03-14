-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedBy" TEXT,
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "cancelledOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastOrderDate" TIMESTAMP(3),
ADD COLUMN     "returnedOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "totalOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "customer_profiles_riskLevel_idx" ON "customer_profiles"("riskLevel");

-- CreateIndex
CREATE INDEX "customer_profiles_isBlocked_idx" ON "customer_profiles"("isBlocked");
