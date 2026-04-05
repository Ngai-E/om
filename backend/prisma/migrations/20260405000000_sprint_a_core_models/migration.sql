-- Sprint A: Core Models Migration
-- Adds Plan, Subscription, PlanEntitlement, TenantOnboarding, PlatformAuditLog, and domain verification enhancements
 
-- ============================================
-- ENUMS
-- ============================================
 
-- Update TenantStatus enum to add DISABLED
ALTER TYPE "TenantStatus" ADD VALUE IF NOT EXISTS 'DISABLED';
 
-- Create OnboardingStatus enum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'BRANDING_INCOMPLETE', 'READY', 'LIVE');
 
-- Create SubscriptionStatus enum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'SUSPENDED');
 
-- Create EntitlementValueType enum
CREATE TYPE "EntitlementValueType" AS ENUM ('BOOLEAN', 'INTEGER', 'STRING');
 
-- Create DomainVerificationStatus enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "DomainVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
 
-- Create SslStatus enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "SslStatus" AS ENUM ('PENDING', 'ACTIVE', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
 
-- ============================================
-- UPDATE TENANT TABLE
-- ============================================
 
-- Add onboardingStatus to Tenant
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "onboardingStatus" "OnboardingStatus" DEFAULT 'PENDING';
 
-- ============================================
-- PLANS TABLE
-- ============================================
 
CREATE TABLE IF NOT EXISTS "plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(10,2),
    "yearlyPrice" DECIMAL(10,2),
    "trialDays" INTEGER NOT NULL DEFAULT 14,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
 
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "plans_code_key" ON "plans"("code");
 
-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
 
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "trialStartsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStartsAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
 
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);
 
CREATE INDEX IF NOT EXISTS "subscriptions_tenantId_idx" ON "subscriptions"("tenantId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
 
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
 
-- ============================================
-- PLAN ENTITLEMENTS TABLE
-- ============================================
 
CREATE TABLE IF NOT EXISTS "plan_entitlements" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueType" "EntitlementValueType" NOT NULL,
    "booleanValue" BOOLEAN,
    "intValue" INTEGER,
    "textValue" TEXT,
 
    CONSTRAINT "plan_entitlements_pkey" PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "plan_entitlements_planId_key_key" ON "plan_entitlements"("planId", "key");
 
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 
-- ============================================
-- TENANT ONBOARDING TABLE
-- ============================================
 
CREATE TABLE IF NOT EXISTS "tenant_onboardings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "businessCategory" TEXT,
    "countryCode" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "selectedPlanCode" TEXT,
    "completedBranding" BOOLEAN NOT NULL DEFAULT false,
    "completedDomain" BOOLEAN NOT NULL DEFAULT false,
    "completedCatalog" BOOLEAN NOT NULL DEFAULT false,
    "completedPayments" BOOLEAN NOT NULL DEFAULT false,
    "currentStep" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
 
    CONSTRAINT "tenant_onboardings_pkey" PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_onboardings_tenantId_key" ON "tenant_onboardings"("tenantId");
 
ALTER TABLE "tenant_onboardings" ADD CONSTRAINT "tenant_onboardings_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 
-- ============================================
-- TENANT DOMAIN VERIFICATION TABLE
-- ============================================
 
CREATE TABLE IF NOT EXISTS "tenant_domain_verifications" (
    "id" TEXT NOT NULL,
    "tenantDomainId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
 
    CONSTRAINT "tenant_domain_verifications_pkey" PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_domain_verifications_tenantDomainId_key" ON "tenant_domain_verifications"("tenantDomainId");
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_domain_verifications_token_key" ON "tenant_domain_verifications"("token");
 
ALTER TABLE "tenant_domain_verifications" ADD CONSTRAINT "tenant_domain_verifications_tenantDomainId_fkey" 
    FOREIGN KEY ("tenantDomainId") REFERENCES "tenant_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 
-- ============================================
-- UPDATE TENANT DOMAINS TABLE
-- ============================================
 
-- Update verificationStatus and sslStatus to use enums if they're currently strings
ALTER TABLE "tenant_domains" 
    ALTER COLUMN "verificationStatus" TYPE "DomainVerificationStatus" 
    USING CASE 
        WHEN "verificationStatus" = 'verified' THEN 'VERIFIED'::"DomainVerificationStatus"
        WHEN "verificationStatus" = 'failed' THEN 'FAILED'::"DomainVerificationStatus"
        ELSE 'PENDING'::"DomainVerificationStatus"
    END;
 
ALTER TABLE "tenant_domains" 
    ALTER COLUMN "sslStatus" TYPE "SslStatus" 
    USING CASE 
        WHEN "sslStatus" = 'active' THEN 'ACTIVE'::"SslStatus"
        WHEN "sslStatus" = 'failed' THEN 'FAILED'::"SslStatus"
        ELSE 'PENDING'::"SslStatus"
    END;
 
-- Set defaults
ALTER TABLE "tenant_domains" ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING';
ALTER TABLE "tenant_domains" ALTER COLUMN "sslStatus" SET DEFAULT 'PENDING';
 
-- ============================================
-- PLATFORM SETTINGS TABLE
-- ============================================
 
CREATE TABLE IF NOT EXISTS "platform_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
 
    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "platform_settings_key_key" ON "platform_settings"("key");
 
-- ============================================
-- TENANT SETTINGS TABLE
-- ============================================
 
CREATE TABLE IF NOT EXISTS "tenant_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
 
    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_settings_tenantId_key_key" ON "tenant_settings"("tenantId", "key");
 
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 
-- ============================================
-- PLATFORM AUDIT LOG TABLE
-- ============================================
 
CREATE TABLE IF NOT EXISTS "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);
 
CREATE INDEX IF NOT EXISTS "platform_audit_logs_targetType_targetId_idx" ON "platform_audit_logs"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_createdAt_idx" ON "platform_audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_actorUserId_idx" ON "platform_audit_logs"("actorUserId");
 
-- ============================================
-- COMMENTS
-- ============================================
 
COMMENT ON TABLE "plans" IS 'SaaS subscription plans with pricing and trial configuration';
COMMENT ON TABLE "subscriptions" IS 'Tenant subscriptions to plans with trial and billing lifecycle';
COMMENT ON TABLE "plan_entitlements" IS 'Feature flags and limits associated with each plan';
COMMENT ON TABLE "tenant_onboardings" IS 'Tracks onboarding progress for new tenants';
COMMENT ON TABLE "tenant_domain_verifications" IS 'Verification tokens for custom domain ownership';
COMMENT ON TABLE "platform_settings" IS 'Platform-wide configuration settings';
COMMENT ON TABLE "tenant_settings" IS 'Tenant-specific configuration settings';
COMMENT ON TABLE "platform_audit_logs" IS 'Audit trail for platform admin actions';
 