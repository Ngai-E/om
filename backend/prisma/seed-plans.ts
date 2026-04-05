import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding plans...');

  // Starter Plan
  const starterPlan = await prisma.plan.upsert({
    where: { code: 'starter' },
    update: {},
    create: {
      code: 'starter',
      name: 'Starter',
      description: 'Perfect for small businesses getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      trialDays: 14,
      isActive: true,
      entitlements: {
        create: [
          { key: 'products_max', valueType: 'INTEGER', intValue: 50 },
          { key: 'staff_max', valueType: 'INTEGER', intValue: 2 },
          { key: 'custom_domain_enabled', valueType: 'BOOLEAN', booleanValue: false },
          { key: 'promotions_enabled', valueType: 'BOOLEAN', booleanValue: false },
          { key: 'api_access_enabled', valueType: 'BOOLEAN', booleanValue: false },
        ],
      },
    },
  });

  // Growth Plan
  const growthPlan = await prisma.plan.upsert({
    where: { code: 'growth' },
    update: {},
    create: {
      code: 'growth',
      name: 'Growth',
      description: 'For growing businesses with more products and staff',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      trialDays: 14,
      isActive: true,
      entitlements: {
        create: [
          { key: 'products_max', valueType: 'INTEGER', intValue: 500 },
          { key: 'staff_max', valueType: 'INTEGER', intValue: 10 },
          { key: 'custom_domain_enabled', valueType: 'BOOLEAN', booleanValue: true },
          { key: 'promotions_enabled', valueType: 'BOOLEAN', booleanValue: true },
          { key: 'api_access_enabled', valueType: 'BOOLEAN', booleanValue: false },
        ],
      },
    },
  });

  // Pro Plan
  const proPlan = await prisma.plan.upsert({
    where: { code: 'pro' },
    update: {},
    create: {
      code: 'pro',
      name: 'Professional',
      description: 'For established businesses with advanced needs',
      monthlyPrice: 99.99,
      yearlyPrice: 999.99,
      trialDays: 14,
      isActive: true,
      entitlements: {
        create: [
          { key: 'products_max', valueType: 'INTEGER', intValue: -1 }, // -1 = unlimited
          { key: 'staff_max', valueType: 'INTEGER', intValue: -1 },
          { key: 'custom_domain_enabled', valueType: 'BOOLEAN', booleanValue: true },
          { key: 'promotions_enabled', valueType: 'BOOLEAN', booleanValue: true },
          { key: 'api_access_enabled', valueType: 'BOOLEAN', booleanValue: true },
          { key: 'priority_support', valueType: 'BOOLEAN', booleanValue: true },
        ],
      },
    },
  });

  console.log('✅ Plans seeded:', {
    starter: starterPlan.id,
    growth: growthPlan.id,
    pro: proPlan.id,
  });
}

seedPlans()
  .catch((e) => {
    console.error('❌ Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
