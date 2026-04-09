-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('TENANT_STORE', 'INDEPENDENT_SERVICE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "MarketplaceRequestType" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateEnum
CREATE TYPE "MarketplaceRequestStatus" AS ENUM ('OPEN', 'MATCHING', 'RECEIVING_OFFERS', 'SHORTLISTED', 'ACCEPTED', 'CLOSED', 'CANCELED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "MarketplaceMatchStatus" AS ENUM ('MATCHED', 'NOTIFIED', 'VIEWED', 'SKIPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MarketplaceOfferStatus" AS ENUM ('SUBMITTED', 'WITHDRAWN', 'REJECTED', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('REQUEST', 'OFFER', 'PROVIDER');

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "providerType" "ProviderType" NOT NULL,
    "status" "ProviderStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "tenantId" TEXT,
    "displayName" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "averageRating" DECIMAL(3,2),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_categories" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_service_areas" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "countryCode" TEXT,
    "city" TEXT,
    "region" TEXT,
    "radiusKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_requests" (
    "id" TEXT NOT NULL,
    "requestType" "MarketplaceRequestType" NOT NULL,
    "status" "MarketplaceRequestStatus" NOT NULL DEFAULT 'OPEN',
    "buyerUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "budgetMin" DECIMAL(10,2),
    "budgetMax" DECIMAL(10,2),
    "currencyCode" TEXT,
    "urgency" TEXT,
    "countryCode" TEXT,
    "city" TEXT,
    "region" TEXT,
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "radiusKm" INTEGER,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "offerCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedOfferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_request_images" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_request_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_matches" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "status" "MarketplaceMatchStatus" NOT NULL DEFAULT 'MATCHED',
    "reasonSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_offers" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" "MarketplaceOfferStatus" NOT NULL DEFAULT 'SUBMITTED',
    "price" DECIMAL(10,2),
    "currencyCode" TEXT,
    "estimatedEta" TEXT,
    "message" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_moderation_flags" (
    "id" TEXT NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_moderation_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE INDEX "providers_status_idx" ON "providers"("status");

-- CreateIndex
CREATE INDEX "providers_tenantId_idx" ON "providers"("tenantId");

-- CreateIndex
CREATE INDEX "provider_categories_providerId_idx" ON "provider_categories"("providerId");

-- CreateIndex
CREATE INDEX "provider_categories_categoryKey_idx" ON "provider_categories"("categoryKey");

-- CreateIndex
CREATE INDEX "provider_service_areas_providerId_idx" ON "provider_service_areas"("providerId");

-- CreateIndex
CREATE INDEX "provider_service_areas_countryCode_city_idx" ON "provider_service_areas"("countryCode", "city");

-- CreateIndex
CREATE INDEX "marketplace_requests_status_idx" ON "marketplace_requests"("status");

-- CreateIndex
CREATE INDEX "marketplace_requests_categoryKey_idx" ON "marketplace_requests"("categoryKey");

-- CreateIndex
CREATE INDEX "marketplace_requests_countryCode_city_idx" ON "marketplace_requests"("countryCode", "city");

-- CreateIndex
CREATE INDEX "marketplace_requests_buyerUserId_idx" ON "marketplace_requests"("buyerUserId");

-- CreateIndex
CREATE INDEX "marketplace_request_images_requestId_idx" ON "marketplace_request_images"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_matches_requestId_providerId_key" ON "marketplace_matches"("requestId", "providerId");

-- CreateIndex
CREATE INDEX "marketplace_matches_providerId_idx" ON "marketplace_matches"("providerId");

-- CreateIndex
CREATE INDEX "marketplace_offers_requestId_idx" ON "marketplace_offers"("requestId");

-- CreateIndex
CREATE INDEX "marketplace_offers_providerId_idx" ON "marketplace_offers"("providerId");

-- CreateIndex
CREATE INDEX "marketplace_moderation_flags_targetType_targetId_idx" ON "marketplace_moderation_flags"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "marketplace_moderation_flags_status_idx" ON "marketplace_moderation_flags"("status");

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_service_areas" ADD CONSTRAINT "provider_service_areas_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_request_images" ADD CONSTRAINT "marketplace_request_images_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "marketplace_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_matches" ADD CONSTRAINT "marketplace_matches_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "marketplace_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_matches" ADD CONSTRAINT "marketplace_matches_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "marketplace_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
