import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPackages() {
  console.log('🌱 Seeding default packages...\n');

  const packages = [
    {
      name: 'starter',
      tier: 'STARTER',
      displayName: 'Starter',
      description: 'Perfect for small businesses just getting started',
      price: 29.99,
      billingCycle: 'monthly',
      maxOrders: 100,
      maxUsers: 5,
      maxProducts: 50,
      features: {
        products: true,
        orders: true,
        customers: true,
        basic_analytics: true,
        email_notifications: true,
        promotions: false,
        advanced_analytics: false,
        multi_location: false,
        api_access: false,
        custom_branding: false,
      },
      sortOrder: 1,
    },
    {
      name: 'professional',
      tier: 'PROFESSIONAL',
      displayName: 'Professional',
      description: 'For growing businesses that need more features',
      price: 79.99,
      billingCycle: 'monthly',
      maxOrders: 500,
      maxUsers: 15,
      maxProducts: 200,
      features: {
        products: true,
        orders: true,
        customers: true,
        basic_analytics: true,
        email_notifications: true,
        promotions: true,
        advanced_analytics: true,
        staff_management: true,
        delivery_zones: true,
        api_access: true,
        custom_branding: false,
        multi_location: false,
        priority_support: false,
      },
      sortOrder: 2,
    },
    {
      name: 'enterprise',
      tier: 'ENTERPRISE',
      displayName: 'Enterprise',
      description: 'For large businesses with advanced needs',
      price: 199.99,
      billingCycle: 'monthly',
      maxOrders: null, // unlimited
      maxUsers: null, // unlimited
      maxProducts: null, // unlimited
      features: {
        products: true,
        orders: true,
        customers: true,
        basic_analytics: true,
        email_notifications: true,
        promotions: true,
        advanced_analytics: true,
        staff_management: true,
        delivery_zones: true,
        api_access: true,
        custom_branding: true,
        multi_location: true,
        priority_support: true,
        dedicated_account_manager: true,
        custom_integrations: true,
        white_label: true,
      },
      sortOrder: 3,
    },
  ];

  for (const pkg of packages) {
    const existing = await prisma.package.findUnique({
      where: { name: pkg.name },
    });

    if (existing) {
      console.log(`⏭️  Package "${pkg.displayName}" already exists, skipping...`);
      continue;
    }

    await prisma.package.create({
      data: pkg as any,
    });

    console.log(`✅ Created package: ${pkg.displayName} ($${pkg.price}/${pkg.billingCycle})`);
  }

  console.log('\n🎉 Package seeding completed!');
  console.log('\n📊 Summary:');
  const allPackages = await prisma.package.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  allPackages.forEach((pkg) => {
    console.log(`  - ${pkg.displayName} (${pkg.tier}): $${pkg.price}/${pkg.billingCycle}`);
  });
}

seedPackages()
  .catch((e) => {
    console.error('❌ Error seeding packages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
