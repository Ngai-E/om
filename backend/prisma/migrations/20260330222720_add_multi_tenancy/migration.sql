/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,slug]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,date,startTime,endTime]` on the table `delivery_slots` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,slug]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `promotions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,key]` on the table `system_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING_SETUP', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('TRIAL', 'BILLING_ACTIVE', 'PAST_DUE', 'BILLING_CANCELLED', 'FREE');

-- CreateEnum
CREATE TYPE "DomainType" AS ENUM ('SUBDOMAIN', 'CUSTOM');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropIndex
DROP INDEX "categories_slug_key";

-- DropIndex
DROP INDEX "delivery_slots_date_startTime_endTime_key";

-- DropIndex
DROP INDEX "products_sku_key";

-- DropIndex
DROP INDEX "products_slug_key";

-- DropIndex
DROP INDEX "promotions_code_key";

-- DropIndex
DROP INDEX "system_settings_key_key";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "delivery_slot_overrides" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "delivery_slot_templates" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "delivery_slots" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "delivery_zones" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "licenses" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "promotions" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "testimonials" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "description" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING_SETUP',
    "billingStatus" "BillingStatus" NOT NULL DEFAULT 'TRIAL',
    "trialStartsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_domains" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" "DomainType" NOT NULL DEFAULT 'SUBDOMAIN',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sslStatus" TEXT DEFAULT 'pending',
    "verificationStatus" TEXT DEFAULT 'pending',
    "verificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_branding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#036637',
    "secondaryColor" TEXT NOT NULL DEFAULT '#FF7730',
    "accentColor" TEXT,
    "fontHeading" TEXT DEFAULT 'Inter',
    "fontBody" TEXT DEFAULT 'Inter',
    "heroConfig" JSONB,
    "themeKey" TEXT DEFAULT 'default',
    "customCss" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_branding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripeCustomerId_key" ON "tenants"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "tenants_billingStatus_idx" ON "tenants"("billingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_domains_domain_key" ON "tenant_domains"("domain");

-- CreateIndex
CREATE INDEX "tenant_domains_tenantId_idx" ON "tenant_domains"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_domains_domain_idx" ON "tenant_domains"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_branding_tenantId_key" ON "tenant_branding"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "carts_tenantId_idx" ON "carts"("tenantId");

-- CreateIndex
CREATE INDEX "categories_tenantId_idx" ON "categories"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenantId_slug_key" ON "categories"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "delivery_slot_overrides_tenantId_idx" ON "delivery_slot_overrides"("tenantId");

-- CreateIndex
CREATE INDEX "delivery_slot_templates_tenantId_idx" ON "delivery_slot_templates"("tenantId");

-- CreateIndex
CREATE INDEX "delivery_slots_tenantId_idx" ON "delivery_slots"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_slots_tenantId_date_startTime_endTime_key" ON "delivery_slots"("tenantId", "date", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "delivery_zones_tenantId_idx" ON "delivery_zones"("tenantId");

-- CreateIndex
CREATE INDEX "licenses_tenantId_idx" ON "licenses"("tenantId");

-- CreateIndex
CREATE INDEX "orders_tenantId_idx" ON "orders"("tenantId");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenantId_slug_key" ON "products"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "promotions_tenantId_idx" ON "promotions"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_tenantId_code_key" ON "promotions"("tenantId", "code");

-- CreateIndex
CREATE INDEX "reviews_tenantId_idx" ON "reviews"("tenantId");

-- CreateIndex
CREATE INDEX "system_settings_tenantId_idx" ON "system_settings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_tenantId_key_key" ON "system_settings"("tenantId", "key");

-- CreateIndex
CREATE INDEX "testimonials_tenantId_idx" ON "testimonials"("tenantId");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- AddForeignKey
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_branding" ADD CONSTRAINT "tenant_branding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_slots" ADD CONSTRAINT "delivery_slots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_slot_templates" ADD CONSTRAINT "delivery_slot_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_slot_overrides" ADD CONSTRAINT "delivery_slot_overrides_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
