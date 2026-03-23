import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReviews() {
  console.log('🔍 Checking reviews in database...\n');

  const reviews = await prisma.review.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log(`Total reviews: ${reviews.length}\n`);

  const groupedByProduct = reviews.reduce((acc, review) => {
    const productName = review.product.name;
    if (!acc[productName]) {
      acc[productName] = {
        slug: review.product.slug,
        id: review.product.id,
        reviews: [],
      };
    }
    acc[productName].reviews.push({
      status: review.status,
      rating: review.rating,
      by: `${review.user.firstName} ${review.user.lastName}`,
    });
    return acc;
  }, {} as any);

  console.log('📊 Reviews by Product:\n');
  Object.entries(groupedByProduct).forEach(([productName, data]: [string, any]) => {
    console.log(`\n${productName}`);
    console.log(`  Slug: ${data.slug}`);
    console.log(`  Product ID: ${data.id}`);
    console.log(`  Frontend URL: http://localhost:3002/products/${data.slug}`);
    console.log(`  Reviews:`);
    data.reviews.forEach((r: any) => {
      console.log(`    - ${r.status} | ${r.rating}⭐ | by ${r.by}`);
    });
  });

  await prisma.$disconnect();
}

checkReviews().catch(console.error);
