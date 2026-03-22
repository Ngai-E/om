import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateCategories() {
  console.log('🔍 Finding duplicate categories...\n');

  // Get all categories
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  // Group by normalized name (lowercase)
  const categoryGroups = new Map<string, typeof categories>();
  
  for (const category of categories) {
    const normalizedName = category.name.toLowerCase().trim();
    if (!categoryGroups.has(normalizedName)) {
      categoryGroups.set(normalizedName, []);
    }
    categoryGroups.get(normalizedName)!.push(category);
  }

  // Find duplicates
  const duplicates = Array.from(categoryGroups.entries()).filter(
    ([_, cats]) => cats.length > 1
  );

  if (duplicates.length === 0) {
    console.log('✅ No duplicate categories found!');
    return;
  }

  console.log(`Found ${duplicates.length} duplicate category groups:\n`);

  for (const [normalizedName, cats] of duplicates) {
    console.log(`📦 "${normalizedName}" has ${cats.length} variations:`);
    cats.forEach((cat) => {
      console.log(`   - "${cat.name}" (${cat._count.products} products)`);
    });

    // Keep the one with most products, or the first one if tied
    const keeper = cats.reduce((prev, curr) =>
      curr._count.products > prev._count.products ? curr : prev
    );

    // Convert keeper name to Title Case
    const titleCaseName = normalizedName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    console.log(`   ✓ Keeping: "${keeper.name}" → "${titleCaseName}"`);

    // Update keeper to title case
    await prisma.category.update({
      where: { id: keeper.id },
      data: { name: titleCaseName },
    });

    // Merge others into keeper
    for (const cat of cats) {
      if (cat.id !== keeper.id) {
        console.log(`   → Merging "${cat.name}" into "${titleCaseName}"`);
        
        // Update all products to use keeper category
        await prisma.product.updateMany({
          where: { categoryId: cat.id },
          data: { categoryId: keeper.id },
        });

        // Delete duplicate category
        await prisma.category.delete({
          where: { id: cat.id },
        });
      }
    }
    console.log('');
  }

  console.log('✅ Duplicate categories merged successfully!');
}

fixDuplicateCategories()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
