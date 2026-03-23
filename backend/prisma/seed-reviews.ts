import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReviews() {
  console.log('🌱 Seeding reviews...');

  try {
    // Get some products and users
    const products = await prisma.product.findMany({
      take: 5,
      where: { isActive: true },
    });

    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      take: 3,
    });

    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (products.length === 0) {
      console.log('❌ No products found. Please seed products first.');
      return;
    }

    if (customers.length === 0) {
      console.log('❌ No customers found. Please create customers first.');
      return;
    }

    console.log(`Found ${products.length} products and ${customers.length} customers`);

    // Sample reviews data
    const reviewsData = [
      {
        rating: 5,
        title: 'Excellent Quality!',
        comment: 'This product exceeded my expectations. Fresh, authentic, and delivered quickly. Will definitely order again!',
        status: 'APPROVED',
      },
      {
        rating: 4,
        title: 'Very Good',
        comment: 'Great product overall. Good quality and taste. Only minor issue was the packaging could be better.',
        status: 'APPROVED',
      },
      {
        rating: 5,
        title: 'Authentic and Fresh',
        comment: 'Exactly what I was looking for! Reminds me of home. The quality is top-notch and the price is reasonable.',
        status: 'APPROVED',
      },
      {
        rating: 3,
        title: 'Decent but could be better',
        comment: 'Product is okay but I expected more for the price. Delivery was fast though.',
        status: 'PENDING',
      },
      {
        rating: 5,
        title: 'Love it!',
        comment: 'Been buying this for months now. Never disappoints. Highly recommend to anyone looking for authentic products.',
        status: 'APPROVED',
      },
      {
        rating: 4,
        title: 'Good value for money',
        comment: 'Quality is good and the portion size is generous. Will buy again.',
        status: 'PENDING',
      },
      {
        rating: 5,
        title: 'Perfect!',
        comment: 'This is exactly what I needed. Fresh, well-packaged, and authentic taste. Customer service was also excellent.',
        status: 'APPROVED',
      },
      {
        rating: 2,
        title: 'Not what I expected',
        comment: 'Product quality was below expectations. Would not recommend.',
        status: 'REJECTED',
      },
      {
        rating: 4,
        title: 'Great product',
        comment: 'Very satisfied with this purchase. Good quality and fast delivery.',
        status: 'APPROVED',
      },
      {
        rating: 5,
        title: 'Outstanding!',
        comment: 'Best quality I have found online. Will be a regular customer from now on.',
        status: 'PENDING',
      },
    ];

    let createdCount = 0;

    // Create reviews for different products
    for (let i = 0; i < reviewsData.length; i++) {
      const reviewData = reviewsData[i];
      const product = products[i % products.length];
      const customer = customers[i % customers.length];

      // Check if review already exists
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: customer.id,
          productId: product.id,
        },
      });

      if (existingReview) {
        console.log(`⏭️  Review already exists for ${product.name} by ${customer.firstName}`);
        continue;
      }

      const review = await prisma.review.create({
        data: {
          userId: customer.id,
          productId: product.id,
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
          status: reviewData.status as any,
          isVerifiedPurchase: Math.random() > 0.5, // Random verified purchase
          approvedBy: reviewData.status === 'APPROVED' ? admin?.id : null,
          approvedAt: reviewData.status === 'APPROVED' ? new Date() : null,
          rejectedBy: reviewData.status === 'REJECTED' ? admin?.id : null,
          rejectedAt: reviewData.status === 'REJECTED' ? new Date() : null,
          rejectionReason: reviewData.status === 'REJECTED' 
            ? 'Does not meet our community guidelines for product reviews.' 
            : null,
        },
      });

      console.log(`✅ Created ${reviewData.status} review for ${product.name} by ${customer.firstName}`);
      createdCount++;
    }

    console.log(`\n🎉 Successfully created ${createdCount} reviews!`);
    console.log(`📊 Review breakdown:`);
    
    const approved = await prisma.review.count({ where: { status: 'APPROVED' } });
    const pending = await prisma.review.count({ where: { status: 'PENDING' } });
    const rejected = await prisma.review.count({ where: { status: 'REJECTED' } });
    
    console.log(`   - Approved: ${approved}`);
    console.log(`   - Pending: ${pending}`);
    console.log(`   - Rejected: ${rejected}`);

  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedReviews()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
