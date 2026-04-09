import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedMarketplace() {
  console.log('🌱 Seeding marketplace data...');

  // 1. Create test users (buyers)
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const buyer1 = await prisma.user.upsert({
    where: { email: 'buyer1@example.com' },
    update: {},
    create: {
      email: 'buyer1@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Buyer',
      role: 'CUSTOMER',
      emailVerified: true,
      isActive: true,
    },
  });

  const buyer2 = await prisma.user.upsert({
    where: { email: 'buyer2@example.com' },
    update: {},
    create: {
      email: 'buyer2@example.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'CUSTOMER',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Created test buyers');

  // 2. Create provider tenants and users
  const providerTenant1 = await prisma.tenant.upsert({
    where: { slug: 'premium-print-co' },
    update: {},
    create: {
      name: 'Premium Print Co',
      slug: 'premium-print-co',
      email: 'contact@premiumprint.com',
      phone: '+1234567890',
      description: 'Professional printing and design services',
      status: 'ACTIVE',
      onboardingStatus: 'LIVE',
      billingStatus: 'BILLING_ACTIVE',
    },
  });

  const providerUser1 = await prisma.user.upsert({
    where: { email: 'provider1@example.com' },
    update: {},
    create: {
      email: 'provider1@example.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Provider',
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      tenantId: providerTenant1.id,
    },
  });

  const providerTenant2 = await prisma.tenant.upsert({
    where: { slug: 'fresh-farm-direct' },
    update: {},
    create: {
      name: 'Fresh Farm Direct',
      slug: 'fresh-farm-direct',
      email: 'contact@freshfarm.com',
      phone: '+1234567891',
      description: 'Organic farm products and fresh produce',
      status: 'ACTIVE',
      onboardingStatus: 'LIVE',
      billingStatus: 'BILLING_ACTIVE',
    },
  });

  const providerUser2 = await prisma.user.upsert({
    where: { email: 'provider2@example.com' },
    update: {},
    create: {
      email: 'provider2@example.com',
      password: hashedPassword,
      firstName: 'Emma',
      lastName: 'Farmer',
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      tenantId: providerTenant2.id,
    },
  });

  const providerTenant3 = await prisma.tenant.upsert({
    where: { slug: 'swift-logistics' },
    update: {},
    create: {
      name: 'Swift Logistics',
      slug: 'swift-logistics',
      email: 'contact@swiftlogistics.com',
      phone: '+1234567892',
      description: 'Fast and reliable delivery services',
      status: 'ACTIVE',
      onboardingStatus: 'LIVE',
      billingStatus: 'BILLING_ACTIVE',
    },
  });

  const providerUser3 = await prisma.user.upsert({
    where: { email: 'provider3@example.com' },
    update: {},
    create: {
      email: 'provider3@example.com',
      password: hashedPassword,
      firstName: 'David',
      lastName: 'Driver',
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      tenantId: providerTenant3.id,
    },
  });

  console.log('✅ Created provider tenants and users');

  // 3. Create marketplace provider profiles
  const provider1 = await prisma.provider.create({
    data: {
      tenantId: providerTenant1.id,
      displayName: 'Premium Print Co',
      slug: 'premium-print-co',
      description: 'We specialize in custom printing, t-shirts, banners, and promotional materials. 10+ years of experience.',
      providerType: 'TENANT_STORE',
      email: 'contact@premiumprint.com',
      phone: '+1234567890',
      status: 'ACTIVE',
      isVerified: true,
      averageRating: 4.9,
      totalReviews: 127,
    },
  });

  const provider2 = await prisma.provider.create({
    data: {
      tenantId: providerTenant2.id,
      displayName: 'Fresh Farm Direct',
      slug: 'fresh-farm-direct',
      description: 'Organic vegetables, fruits, and farm products delivered fresh to your door. Family-owned farm since 1985.',
      providerType: 'TENANT_STORE',
      email: 'contact@freshfarm.com',
      phone: '+1234567891',
      status: 'ACTIVE',
      isVerified: true,
      averageRating: 4.8,
      totalReviews: 89,
    },
  });

  const provider3 = await prisma.provider.create({
    data: {
      tenantId: providerTenant3.id,
      displayName: 'Swift Logistics',
      slug: 'swift-logistics',
      description: 'Professional freight and delivery services. Same-day delivery available in major cities.',
      providerType: 'TENANT_STORE',
      email: 'contact@swiftlogistics.com',
      phone: '+1234567892',
      status: 'ACTIVE',
      isVerified: true,
      averageRating: 4.7,
      totalReviews: 203,
    },
  });

  console.log('✅ Created marketplace provider profiles');

  // 4. Create marketplace requests
  const request1 = await prisma.marketplaceRequest.create({
    data: {
      requestType: 'PRODUCT',
      buyerUserId: buyer1.id,
      title: 'Need 500 custom t-shirts for company event',
      description: 'Looking for high-quality custom printed t-shirts for our annual company event. Need various sizes (S-XXL) with our company logo on the front and event details on the back. Prefer cotton blend material.',
      categoryKey: 'Products',
      budgetMin: 2000,
      budgetMax: 3000,
      currencyCode: 'USD',
      urgency: 'NORMAL',
      city: 'San Francisco',
      countryCode: 'US',
      status: 'RECEIVING_OFFERS',
    },
  });

  const request2 = await prisma.marketplaceRequest.create({
    data: {
      requestType: 'SERVICE',
      buyerUserId: buyer1.id,
      title: 'Mobile app development for fitness tracker',
      description: 'Need an experienced mobile app developer to build a fitness tracking app for iOS and Android. Should include workout logging, progress tracking, and social features.',
      categoryKey: 'Services',
      budgetMin: 15000,
      budgetMax: 25000,
      currencyCode: 'USD',
      urgency: 'HIGH',
      city: 'Seattle',
      countryCode: 'US',
      status: 'RECEIVING_OFFERS',
    },
  });

  const request3 = await prisma.marketplaceRequest.create({
    data: {
      requestType: 'PRODUCT',
      buyerUserId: buyer2.id,
      title: 'Fresh organic vegetables weekly delivery',
      description: 'Looking for a reliable supplier to deliver fresh organic vegetables weekly to our restaurant. Need seasonal variety and consistent quality.',
      categoryKey: 'Agriculture',
      budgetMin: 200,
      budgetMax: 400,
      currencyCode: 'USD',
      urgency: 'NORMAL',
      city: 'Portland',
      countryCode: 'US',
      status: 'RECEIVING_OFFERS',
    },
  });

  const request4 = await prisma.marketplaceRequest.create({
    data: {
      requestType: 'PRODUCT',
      buyerUserId: buyer2.id,
      title: 'Commercial refrigeration units',
      description: 'Need 3 commercial-grade refrigeration units for our new restaurant location. Must meet health code requirements and have warranty.',
      categoryKey: 'Products',
      budgetMin: 3000,
      currencyCode: 'USD',
      urgency: 'HIGH',
      city: 'Miami',
      countryCode: 'US',
      status: 'RECEIVING_OFFERS',
    },
  });

  const request5 = await prisma.marketplaceRequest.create({
    data: {
      requestType: 'SERVICE',
      buyerUserId: buyer1.id,
      title: 'Event photography for wedding',
      description: 'Professional photographer needed for wedding ceremony and reception. 8 hours coverage, edited photos delivered within 2 weeks.',
      categoryKey: 'Creative',
      budgetMin: 1500,
      budgetMax: 2500,
      currencyCode: 'USD',
      urgency: 'NORMAL',
      city: 'Los Angeles',
      countryCode: 'US',
      status: 'RECEIVING_OFFERS',
    },
  });

  const request6 = await prisma.marketplaceRequest.create({
    data: {
      requestType: 'SERVICE',
      buyerUserId: buyer2.id,
      title: 'Freight shipping coast to coast',
      description: 'Need reliable freight service to ship 20 pallets of merchandise from California to New York. Temperature-controlled preferred.',
      categoryKey: 'Logistics',
      currencyCode: 'USD',
      urgency: 'NORMAL',
      city: 'Chicago',
      countryCode: 'US',
      status: 'RECEIVING_OFFERS',
    },
  });

  console.log('✅ Created marketplace requests');

  // 5. Create offers for requests
  const offer1 = await prisma.marketplaceOffer.create({
    data: {
      requestId: request1.id,
      providerId: provider1.id,
      price: 2500,
      currencyCode: 'USD',
      message: 'We can provide high-quality custom t-shirts with your specifications. We have 10+ years of experience and can deliver within 2-3 weeks. Free design consultation included!',
      estimatedEta: '2-3 weeks',
      status: 'SUBMITTED',
    },
  });

  const offer2 = await prisma.marketplaceOffer.create({
    data: {
      requestId: request3.id,
      providerId: provider2.id,
      price: 300,
      currencyCode: 'USD',
      message: 'We can supply fresh organic vegetables weekly from our family farm. All produce is certified organic and harvested the day before delivery. Flexible delivery schedule available.',
      estimatedEta: '1 week',
      status: 'SUBMITTED',
    },
  });

  const offer3 = await prisma.marketplaceOffer.create({
    data: {
      requestId: request6.id,
      providerId: provider3.id,
      price: 1800,
      currencyCode: 'USD',
      message: 'We offer reliable coast-to-coast freight services with temperature-controlled trailers. Full insurance coverage and real-time tracking included. Delivery in 5-7 days.',
      estimatedEta: '5-7 days',
      status: 'SUBMITTED',
    },
  });

  const offer4 = await prisma.marketplaceOffer.create({
    data: {
      requestId: request1.id,
      providerId: provider1.id,
      price: 2800,
      currencyCode: 'USD',
      message: 'Premium quality t-shirts with eco-friendly inks. Can provide samples before bulk production. Rush delivery available if needed.',
      estimatedEta: '2 weeks',
      status: 'SUBMITTED',
    },
  });

  console.log('✅ Created marketplace offers');

  // Update request offer counts
  await prisma.marketplaceRequest.update({
    where: { id: request1.id },
    data: { offerCount: 2 },
  });

  await prisma.marketplaceRequest.update({
    where: { id: request3.id },
    data: { offerCount: 1 },
  });

  await prisma.marketplaceRequest.update({
    where: { id: request6.id },
    data: { offerCount: 1 },
  });

  console.log('✅ Updated request offer counts');
  console.log('🎉 Marketplace seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Created 2 buyers`);
  console.log(`   - Created 3 provider tenants`);
  console.log(`   - Created 3 provider profiles`);
  console.log(`   - Created 6 marketplace requests`);
  console.log(`   - Created 4 offers`);
  console.log('\n🔐 Test Credentials:');
  console.log('   Buyers:');
  console.log('   - buyer1@example.com / password123');
  console.log('   - buyer2@example.com / password123');
  console.log('   Providers:');
  console.log('   - provider1@example.com / password123 (Premium Print Co)');
  console.log('   - provider2@example.com / password123 (Fresh Farm Direct)');
  console.log('   - provider3@example.com / password123 (Swift Logistics)');
}

seedMarketplace()
  .catch((e) => {
    console.error('❌ Error seeding marketplace:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
