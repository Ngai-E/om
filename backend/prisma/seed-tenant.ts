/**
 * Backfill script: Creates tenant_omega and assigns all existing records to it.
 * 
 * Run after the multi-tenancy migration:
 *   npx ts-node prisma/seed-tenant.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_OMEGA_SLUG = 'omegaafro';
const TENANT_OMEGA_NAME = 'Omega Afro Shop';
const TENANT_OMEGA_EMAIL = 'admin@omegaafroshop.com';

async function main() {
  console.log('🚀 Starting tenant backfill...\n');

  // Step 1: Create tenant_omega
  let tenant = await prisma.tenant.findUnique({
    where: { slug: TENANT_OMEGA_SLUG },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: TENANT_OMEGA_NAME,
        slug: TENANT_OMEGA_SLUG,
        email: TENANT_OMEGA_EMAIL,
        status: 'ACTIVE',
        billingStatus: 'FREE', // Original store gets free forever
        trialStartsAt: new Date(),
      },
    });
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`);
  } else {
    console.log(`ℹ️  Tenant already exists: ${tenant.name} (${tenant.id})`);
  }

  const tenantId = tenant.id;

  // Step 2: Create default branding
  const existingBranding = await prisma.tenantBranding.findUnique({
    where: { tenantId },
  });

  if (!existingBranding) {
    await prisma.tenantBranding.create({
      data: {
        tenantId,
        primaryColor: '#036637',
        secondaryColor: '#FF7730',
        fontHeading: 'Inter',
        fontBody: 'Inter',
        themeKey: 'default',
      },
    });
    console.log('✅ Created default branding');
  }

  // Step 3: Create default domain
  const existingDomain = await prisma.tenantDomain.findFirst({
    where: { tenantId },
  });

  if (!existingDomain) {
    await prisma.tenantDomain.create({
      data: {
        tenantId,
        domain: `${TENANT_OMEGA_SLUG}.stores.com`,
        type: 'SUBDOMAIN',
        isPrimary: true,
        sslStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
      },
    });
    console.log('✅ Created default domain');
  }

  // Step 4: Backfill tenantId on all existing records
  console.log('\n📦 Backfilling tenantId on existing records...\n');

  const tables = [
    { name: 'User', model: 'user' },
    { name: 'Category', model: 'category' },
    { name: 'Product', model: 'product' },
    { name: 'Review', model: 'review' },
    { name: 'Testimonial', model: 'testimonial' },
    { name: 'Cart', model: 'cart' },
    { name: 'Order', model: 'order' },
    { name: 'DeliveryZone', model: 'deliveryZone' },
    { name: 'DeliverySlot', model: 'deliverySlot' },
    { name: 'DeliverySlotTemplate', model: 'deliverySlotTemplate' },
    { name: 'DeliverySlotOverride', model: 'deliverySlotOverride' },
    { name: 'SystemSettings', model: 'systemSettings' },
    { name: 'Promotion', model: 'promotion' },
    { name: 'AuditLog', model: 'auditLog' },
  ];

  for (const table of tables) {
    try {
      const result = await (prisma as any)[table.model].updateMany({
        where: { tenantId: null },
        data: { tenantId },
      });
      console.log(`  ✅ ${table.name}: ${result.count} rows updated`);
    } catch (error: any) {
      console.log(`  ⚠️  ${table.name}: ${error.message}`);
    }
  }

  // Step 5: Link existing licenses to tenant
  try {
    const result = await prisma.license.updateMany({
      where: { tenantId: null },
      data: { tenantId },
    });
    console.log(`  ✅ License: ${result.count} rows updated`);
  } catch (error: any) {
    console.log(`  ⚠️  License: ${error.message}`);
  }

  console.log('\n🎉 Tenant backfill complete!');
  console.log(`\n📋 Tenant ID: ${tenantId}`);
  console.log(`📋 Tenant Slug: ${TENANT_OMEGA_SLUG}`);
  console.log(`📋 Store URL: ${TENANT_OMEGA_SLUG}.stores.com`);
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
