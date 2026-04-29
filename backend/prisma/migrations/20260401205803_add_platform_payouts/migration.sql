-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "platform_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_balances" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPlatformFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalTaxes" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "lastPayoutAt" TIMESTAMP(3),

    CONSTRAINT "tenant_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_payouts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "platformFee" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankSortCode" TEXT,
    "stripePayoutId" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedBy" TEXT,

    CONSTRAINT "tenant_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_config_key_key" ON "platform_config"("key");

-- CreateIndex
CREATE INDEX "platform_config_key_idx" ON "platform_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_balances_tenantId_key" ON "tenant_balances"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_balances_tenantId_idx" ON "tenant_balances"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_payouts_tenantId_idx" ON "tenant_payouts"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_payouts_status_idx" ON "tenant_payouts"("status");

-- CreateIndex
CREATE INDEX "tenant_payouts_createdAt_idx" ON "tenant_payouts"("createdAt");

-- AddForeignKey
ALTER TABLE "tenant_balances" ADD CONSTRAINT "tenant_balances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_payouts" ADD CONSTRAINT "tenant_payouts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
