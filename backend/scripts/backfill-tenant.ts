import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillTenantOmega() {
  console.log('🚀 Starting tenant_omega backfill...');

  try {
    // 1. Create the tenant_omega record
    const tenant = await (prisma as any).tenant.upsert({
      where: { id: 'tenant_omega' },
      update: {},
      create: {
        id: 'tenant_omega',
        name: 'OMEGA AFRO CARIBBEAN SUPERSTORE LTD',
        slug: 'omegaafro',
        email: 'info@omegaafroshop.com',
        status: 'ACTIVE',
        billingStatus: 'FREE',
      },
    });
    console.log('✅ Created/updated tenant_omega:', tenant.name);

    // 2. Create default branding
    const branding = await (prisma as any).tenantBranding.upsert({
      where: { tenantId: 'tenant_omega' },
      update: {},
      create: {
        tenantId: 'tenant_omega',
        primaryColor: '#036637',
        secondaryColor: '#FF7730',
        accentColor: '#F59E0B',
        fontHeading: 'Inter',
        fontBody: 'Inter',
        heroConfig: {
          heading: "Welcome to OMEGA AFRO CARIBBEAN SUPERSTORE",
          subheading: "Quality products. Great prices. Fast delivery.",
          trustBadges: ["Fast Delivery", "Quality Products", "Best Prices"]
        },
        themeKey: 'default',
      },
    });
    console.log('✅ Created/updated branding');

    // 3. Create default domain
    const domain = await (prisma as any).tenantDomain.upsert({
      where: { domain: 'omegaafro.viralsocialmediabooster.com' },
      update: {},
      create: {
        tenantId: 'tenant_omega',
        domain: 'omegaafro.viralsocialmediabooster.com',
        type: 'SUBDOMAIN',
        isPrimary: true,
        sslStatus: 'pending',
        verificationStatus: 'verified',
      },
    });
    console.log('✅ Created/updated domain');

    // 4. Backfill all existing records
    const tables = [
      'users',
      'categories', 
      'products',
      'reviews',
      'testimonials',
      'carts',
      'orders',
      'delivery_zones',
      'delivery_slots',
      'delivery_slot_templates',
      'delivery_slot_overrides',
      'system_settings',
      'promotions',
      'audit_logs',
      'licenses'
    ];

    for (const table of tables) {
      const sql = `UPDATE "${table}" SET "tenantId" = 'tenant_omega' WHERE "tenantId" IS NULL`;
      // @ts-ignore
      const result = await prisma.$executeRawUnsafe(sql);
      console.log(`✅ Backfilled ${table}`);
    }

    // 5. Create tenant balance
    const balance = await (prisma as any).tenantBalance.upsert({
      where: { tenantId: 'tenant_omega' },
      update: {},
      create: {
        tenantId: 'tenant_omega',
        currentBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      },
    });
    console.log('✅ Created/updated tenant balance');

    console.log('🎉 Tenant_omega backfill completed successfully!');
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillTenantOmega();
