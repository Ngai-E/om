/*
  Backfill existing data with tenant_omega as the default tenant
  This migration:
  1. Creates the tenant_omega record if it doesn't exist
  2. Backfills all existing records with tenantId = tenant_omega
  3. Makes tenantId NOT NULL after backfill
*/

-- Create the tenant_omega record
INSERT INTO "tenants" (
  "id", 
  "name", 
  "slug", 
  "email", 
  "status", 
  "billingStatus",
  "createdAt",
  "updatedAt"
) VALUES (
  'tenant_omega',
  'OMEGA AFRO CARIBBEAN SUPERSTORE LTD',
  'omegaafro',
  'info@omegaafroshop.com',
  'ACTIVE',
  'FREE',
  NOW(),
  NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Create default branding for tenant_omega
INSERT INTO "tenant_branding" (
  "id",
  "tenantId", 
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "fontHeading",
  "fontBody",
  "heroConfig",
  "themeKey",
  "createdAt",
  "updatedAt"
) VALUES (
  'branding_omega',
  'tenant_omega',
  '#036637',
  '#FF7730',
  '#F59E0B',
  'Inter',
  'Inter',
  '{"heading": "Welcome to OMEGA AFRO CARIBBEAN SUPERSTORE", "subheading": "Quality products. Great prices. Fast delivery.", "trustBadges": ["Fast Delivery", "Quality Products", "Best Prices"]}',
  'default',
  NOW(),
  NOW()
) ON CONFLICT ("tenantId") DO NOTHING;

-- Create default domain for tenant_omega
INSERT INTO "tenant_domains" (
  "id",
  "tenantId",
  "domain",
  "type",
  "isPrimary",
  "sslStatus",
  "verificationStatus",
  "createdAt",
  "updatedAt"
) VALUES (
  'domain_omega',
  'tenant_omega',
  'omegaafro.stores.xxx',
  'SUBDOMAIN',
  true,
  'pending',
  'verified',
  NOW(),
  NOW()
) ON CONFLICT ("domain") DO NOTHING;

-- Backfill all existing records with tenantId = tenant_omega
-- Users
UPDATE "users" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Categories
UPDATE "categories" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Products
UPDATE "products" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Reviews
UPDATE "reviews" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Testimonials
UPDATE "testimonials" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Carts
UPDATE "carts" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Orders
UPDATE "orders" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Delivery Zones
UPDATE "delivery_zones" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Delivery Slots
UPDATE "delivery_slots" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Delivery Slot Templates
UPDATE "delivery_slot_templates" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Delivery Slot Overrides
UPDATE "delivery_slot_overrides" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- System Settings
UPDATE "system_settings" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Promotions
UPDATE "promotions" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Audit Logs
UPDATE "audit_logs" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Licenses
UPDATE "licenses" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL;

-- Create tenant balance for omega
INSERT INTO "tenant_balances" (
  "id",
  "tenantId",
  "currentBalance",
  "totalEarned",
  "totalWithdrawn",
  "lastUpdated",
  "createdAt",
  "updatedAt"
) VALUES (
  'balance_omega',
  'tenant_omega',
  0,
  0,
  0,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT ("tenantId") DO NOTHING;
