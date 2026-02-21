import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // 1. Create Users
  // ============================================
  console.log('Creating users...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@omegaafroshop.com' },
    update: {},
    create: {
      email: 'admin@omegaafroshop.com',
      password: await bcrypt.hash('Admin123!', 12),
      firstName: 'Admin',
      lastName: 'User',
      phone: '+447535316253',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@omegaafroshop.com' },
    update: {},
    create: {
      email: 'staff@omegaafroshop.com',
      password: await bcrypt.hash('Staff123!', 12),
      firstName: 'Staff',
      lastName: 'User',
      phone: '+447535316254',
      role: 'STAFF',
      emailVerified: true,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: await bcrypt.hash('Customer123!', 12),
      firstName: 'John',
      lastName: 'Doe',
      phone: '+447535316255',
      role: 'CUSTOMER',
      emailVerified: true,
      customerProfile: {
        create: {
          marketingOptIn: true,
          smsOptIn: false,
        },
      },
    },
  });

  console.log('✅ Users created');

  // ============================================
  // 2. Create Categories
  // ============================================
  console.log('Creating categories...');

  const categories = [
    {
      name: 'Fresh Produce',
      slug: 'fresh-produce',
      description: 'Fresh fruits and vegetables from Africa and the Caribbean',
      sortOrder: 1,
    },
    {
      name: 'Meats & Fish',
      slug: 'meats-fish',
      description: 'Quality meats and fresh fish',
      sortOrder: 2,
    },
    {
      name: 'Dry Foods',
      slug: 'dry-foods',
      description: 'Grains, flours, and dry goods',
      sortOrder: 3,
    },
    {
      name: 'Frozen Foods',
      slug: 'frozen-foods',
      description: 'Frozen vegetables, meats, and ready meals',
      sortOrder: 4,
    },
    {
      name: 'Spices & Seasonings',
      slug: 'spices-seasonings',
      description: 'Authentic African and Caribbean spices',
      sortOrder: 5,
    },
    {
      name: 'Drinks & Beverages',
      slug: 'drinks-beverages',
      description: 'Soft drinks, juices, and traditional beverages',
      sortOrder: 6,
    },
  ];

  const createdCategories = {};
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    createdCategories[category.slug] = created;
  }

  console.log('✅ Categories created');

  // ============================================
  // 3. Create Products
  // ============================================
  console.log('Creating products...');

  const products = [
    // Fresh Produce
    {
      name: 'Green Plantains',
      slug: 'green-plantains',
      description: 'Fresh green plantains from Ghana. Perfect for frying or boiling.',
      price: 2.99,
      unitSize: '1kg',
      sku: 'PLANT-001',
      categoryId: createdCategories['fresh-produce'].id,
      origin: 'Ghana',
      tags: ['vegan', 'gluten-free'],
      isFeatured: true,
      stock: 50,
    },
    {
      name: 'Ripe Plantains',
      slug: 'ripe-plantains',
      description: 'Sweet ripe plantains, ready to eat or fry.',
      price: 3.49,
      unitSize: '1kg',
      sku: 'PLANT-002',
      categoryId: createdCategories['fresh-produce'].id,
      origin: 'Ghana',
      tags: ['vegan', 'gluten-free'],
      stock: 30,
    },
    {
      name: 'Yam',
      slug: 'yam',
      description: 'Fresh African yam, perfect for pounding or boiling.',
      price: 4.99,
      unitSize: '1kg',
      sku: 'YAM-001',
      categoryId: createdCategories['fresh-produce'].id,
      origin: 'Nigeria',
      tags: ['vegan', 'gluten-free'],
      stock: 40,
    },
    {
      name: 'Cassava',
      slug: 'cassava',
      description: 'Fresh cassava root.',
      price: 3.99,
      unitSize: '1kg',
      sku: 'CASS-001',
      categoryId: createdCategories['fresh-produce'].id,
      origin: 'Ghana',
      tags: ['vegan', 'gluten-free'],
      stock: 35,
    },
    {
      name: 'Scotch Bonnet Peppers',
      slug: 'scotch-bonnet-peppers',
      description: 'Hot and flavorful Scotch Bonnet peppers.',
      price: 1.99,
      unitSize: '100g',
      sku: 'PEPPER-001',
      categoryId: createdCategories['fresh-produce'].id,
      origin: 'Jamaica',
      tags: ['vegan', 'gluten-free', 'spicy'],
      stock: 60,
    },

    // Dry Foods
    {
      name: 'Gari (Cassava Flakes)',
      slug: 'gari-cassava-flakes',
      description: 'Fine cassava flakes, perfect for making eba or eaten as cereal.',
      price: 3.49,
      unitSize: '500g',
      sku: 'GARI-001',
      categoryId: createdCategories['dry-foods'].id,
      origin: 'Nigeria',
      tags: ['vegan', 'gluten-free'],
      isFeatured: true,
      stock: 100,
    },
    {
      name: 'Fufu Flour',
      slug: 'fufu-flour',
      description: 'Instant fufu flour, just add hot water.',
      price: 4.99,
      unitSize: '1kg',
      sku: 'FUFU-001',
      categoryId: createdCategories['dry-foods'].id,
      origin: 'Ghana',
      tags: ['vegan', 'gluten-free'],
      stock: 80,
    },
    {
      name: 'Rice (Long Grain)',
      slug: 'rice-long-grain',
      description: 'Premium long grain rice.',
      price: 12.99,
      unitSize: '5kg',
      sku: 'RICE-001',
      categoryId: createdCategories['dry-foods'].id,
      tags: ['vegan', 'gluten-free'],
      stock: 50,
    },
    {
      name: 'Black-Eyed Beans',
      slug: 'black-eyed-beans',
      description: 'Dried black-eyed beans.',
      price: 2.99,
      unitSize: '500g',
      sku: 'BEANS-001',
      categoryId: createdCategories['dry-foods'].id,
      tags: ['vegan', 'gluten-free'],
      stock: 70,
    },

    // Spices & Seasonings
    {
      name: 'Maggi Seasoning Cubes',
      slug: 'maggi-seasoning-cubes',
      description: 'Classic Maggi seasoning cubes for authentic flavor.',
      price: 1.99,
      unitSize: '100g',
      sku: 'MAGGI-001',
      categoryId: createdCategories['spices-seasonings'].id,
      stock: 120,
    },
    {
      name: 'Curry Powder',
      slug: 'curry-powder',
      description: 'Authentic African curry powder.',
      price: 2.49,
      unitSize: '100g',
      sku: 'CURRY-001',
      categoryId: createdCategories['spices-seasonings'].id,
      tags: ['vegan'],
      stock: 90,
    },
    {
      name: 'Dried Crayfish',
      slug: 'dried-crayfish',
      description: 'Ground dried crayfish for soups and stews.',
      price: 5.99,
      unitSize: '100g',
      sku: 'CRAY-001',
      categoryId: createdCategories['spices-seasonings'].id,
      allergens: 'Shellfish',
      stock: 45,
    },

    // Frozen Foods
    {
      name: 'Frozen Tilapia Fish',
      slug: 'frozen-tilapia-fish',
      description: 'Whole frozen tilapia fish.',
      price: 6.99,
      unitSize: '1kg',
      sku: 'FISH-001',
      categoryId: createdCategories['frozen-foods'].id,
      allergens: 'Fish',
      stock: 30,
    },
    {
      name: 'Frozen Goat Meat',
      slug: 'frozen-goat-meat',
      description: 'Premium frozen goat meat.',
      price: 9.99,
      unitSize: '1kg',
      sku: 'GOAT-001',
      categoryId: createdCategories['meats-fish'].id,
      tags: ['halal'],
      stock: 25,
    },

    // Drinks
    {
      name: 'Malta Guinness',
      slug: 'malta-guinness',
      description: 'Non-alcoholic malt drink.',
      price: 1.49,
      unitSize: '330ml',
      sku: 'MALTA-001',
      categoryId: createdCategories['drinks-beverages'].id,
      stock: 150,
    },
    {
      name: 'Supermalt',
      slug: 'supermalt',
      description: 'Classic Supermalt malt drink.',
      price: 1.49,
      unitSize: '330ml',
      sku: 'SUPER-001',
      categoryId: createdCategories['drinks-beverages'].id,
      stock: 140,
    },
  ];

  for (const product of products) {
    const { stock, ...productData } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...productData,
        inventory: {
          create: {
            quantity: stock,
            lowStockThreshold: 10,
          },
        },
      },
    });
  }

  console.log('✅ Products created');

  // ============================================
  // 4. Create Delivery Zones
  // ============================================
  console.log('Creating delivery zones...');

  const deliveryZones = [
    {
      name: 'Bolton Central',
      postcodePrefix: ['BL1', 'BL2', 'BL3', 'BL4'],
      deliveryFee: 3.99,
      minOrderValue: 20.0,
      freeDeliveryThreshold: 50.0,
    },
    {
      name: 'Bolton North',
      postcodePrefix: ['BL5', 'BL6'],
      deliveryFee: 4.99,
      minOrderValue: 25.0,
      freeDeliveryThreshold: 60.0,
    },
    {
      name: 'Manchester',
      postcodePrefix: ['M1', 'M2', 'M3', 'M4', 'M15', 'M16'],
      deliveryFee: 5.99,
      minOrderValue: 30.0,
      freeDeliveryThreshold: 70.0,
    },
    {
      name: 'Salford',
      postcodePrefix: ['M5', 'M6', 'M7'],
      deliveryFee: 5.99,
      minOrderValue: 30.0,
      freeDeliveryThreshold: 70.0,
    },
  ];

  for (const zone of deliveryZones) {
    const existing = await prisma.deliveryZone.findFirst({
      where: { name: zone.name },
    });
    
    if (!existing) {
      await prisma.deliveryZone.create({
        data: zone,
      });
    }
  }

  console.log('✅ Delivery zones created');

  // ============================================
  // 5. Create Delivery Slots (Next 7 Days)
  // ============================================
  console.log('Creating delivery slots...');

  const timeSlots = [
    { startTime: '10:00', endTime: '12:00' },
    { startTime: '14:00', endTime: '16:00' },
    { startTime: '16:00', endTime: '18:00' },
  ];

  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    for (const slot of timeSlots) {
      await prisma.deliverySlot.upsert({
        where: {
          date_startTime_endTime: {
            date: date,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        },
        update: {},
        create: {
          date: date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: 10,
        },
      });
    }
  }

  console.log('✅ Delivery slots created');

  // ============================================
  // 6. Create Sample Address for Customer
  // ============================================
  console.log('Creating sample address...');

  const boltonZone = await prisma.deliveryZone.findFirst({
    where: { name: 'Bolton Central' },
  });

  await prisma.address.upsert({
    where: { id: 'sample-address-id' },
    update: {},
    create: {
      id: 'sample-address-id',
      userId: customerUser.id,
      label: 'Home',
      line1: '76-78 Higher Market Street',
      line2: '',
      city: 'Farnworth',
      county: 'Bolton',
      postcode: 'BL4 9BB',
      country: 'GB',
      isDefault: true,
      deliveryZoneId: boltonZone?.id,
    },
  });

  console.log('✅ Sample address created');

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📧 Default Users:');
  console.log('   Admin:    admin@omegaafroshop.com / Admin123!');
  console.log('   Staff:    staff@omegaafroshop.com / Staff123!');
  console.log('   Customer: customer@example.com / Customer123!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
