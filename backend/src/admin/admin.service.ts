import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, UpdateInventoryDto, InventoryAction, CreateStaffDto, UpdateStaffDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private auditService: AuditService,
  ) {}

  // ============================================
  // DASHBOARD & STATS
  // ============================================

  async getBadgeCounts(tenantId?: string) {
    // Count pending orders (RECEIVED status - newly placed orders)
    const pendingOrders = await this.prisma.order.count({
      where: {
        status: 'RECEIVED',
        ...(tenantId && { tenantId }),
      },
    });

    // Get variant-aware low stock count
    const products = await this.prisma.product.findMany({
      where: { isActive: true, ...(tenantId && { tenantId }) },
      include: {
        variants: {
          where: { isActive: true },
        },
        inventory: true,
      },
    });

    let lowStockItems = 0;

    for (const product of products) {
      const threshold = product.inventory?.lowStockThreshold || 10;
      
      if (product.variants && product.variants.length > 0) {
        // Count variants with low stock (including out of stock for badge alert)
        for (const variant of product.variants) {
          if (variant.stock <= threshold) {
            lowStockItems++;
          }
        }
      } else {
        // Count products without variants
        if (product.inventory && product.inventory.quantity <= threshold) {
          lowStockItems++;
        }
      }
    }

    return {
      pendingOrders,
      lowStockItems,
    };
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    search?: string,
    entity?: string,
    action?: string,
    userId?: string,
    tenantId?: string,
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (entity) {
      where.entity = entity;
    }

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (userId) {
      where.userId = userId;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // PRODUCT MANAGEMENT
  // ============================================

  async getProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        inventory: true,
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(dto: CreateProductDto, userId?: string, tenantId?: string) {
    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    const existing = await this.prisma.product.findFirst({
      where: { slug, ...(tenantId && { tenantId }) },
    });

    if (existing) {
      throw new BadRequestException(`Product with slug "${slug}" already exists`);
    }

    // Handle category - support both categoryId and legacy category name
    let categoryId = dto.categoryId;
    if (!categoryId && dto.category) {
      // Legacy: Find or create category by name
      let category = await this.prisma.category.findFirst({
        where: { name: dto.category, ...(tenantId && { tenantId }) },
      });

      if (!category) {
        let categorySlug = dto.category
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Check if slug already exists and append number if needed
        let slugExists = await this.prisma.category.findFirst({
          where: { slug: categorySlug, ...(tenantId && { tenantId }) },
        });
        
        let counter = 1;
        while (slugExists) {
          categorySlug = `${dto.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${counter}`;
          slugExists = await this.prisma.category.findFirst({
            where: { slug: categorySlug, ...(tenantId && { tenantId }) },
          });
          counter++;
        }
        
        category = await this.prisma.category.create({
          data: {
            name: dto.category,
            slug: categorySlug,
            ...(tenantId && { tenantId }),
          },
        });
      }
      categoryId = category.id;
    }

    if (!categoryId) {
      throw new BadRequestException('Category is required');
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        ...(tenantId && { tenantId }),
        description: dto.description,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice || null,
        categoryId,
        unitSize: dto.unitSize || dto.unit || undefined,
        sku: dto.sku || undefined,
        barcode: dto.barcode || undefined,
        tags: dto.tags || [],
        isFeatured: dto.isFeatured || false,
        isActive: dto.isActive !== false,
        // Create images if provided
        images: dto.images && dto.images.length > 0 ? {
          create: dto.images.map((img, index) => ({
            url: img.url,
            altText: img.altText || dto.name,
            sortOrder: index,
          })),
        } : undefined,
        // Create inventory if provided
        inventory: {
          create: {
            quantity: dto.inventory?.quantity ?? dto.stock ?? 0,
            lowStockThreshold: dto.inventory?.lowStockThreshold ?? 10,
            isTracked: dto.inventory?.isTracked ?? true,
          },
        },
      },
      include: {
        images: true,
        inventory: true,
        category: true,
      },
    });

    // Audit log
    if (userId) {
      await this.auditService.log({
        userId,
        action: 'PRODUCT_CREATE',
        entity: 'Product',
        entityId: product.id,
        changes: { created: { name: dto.name, price: dto.price, categoryId } },
      });
    }

    // Clear cache for product lists (new product added)
    console.log('🗑️  Cleared product list cache (new product created)');

    // Clear product cache
    await this.clearProductCache(product.id, product.slug);

    return product;
  }

  async updateProduct(productId: string, dto: UpdateProductDto, tenantId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If name is being updated, regenerate slug
    let slug = product.slug;
    if (dto.name && dto.name !== product.name) {
      slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if new slug conflicts
      const existing = await this.prisma.product.findFirst({
        where: { slug, ...(tenantId && { tenantId }) },
      });

      if (existing && existing.id !== productId) {
        throw new BadRequestException(`Product with slug "${slug}" already exists`);
      }
    }

    // Handle category update
    let categoryId = product.categoryId;
    if (dto.category) {
      let category = await this.prisma.category.findFirst({
        where: { name: dto.category, ...(tenantId && { tenantId }) },
      });

      if (!category) {
        let categorySlug = dto.category
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Check if slug already exists and append number if needed
        let slugExists = await this.prisma.category.findFirst({
          where: { slug: categorySlug, ...(tenantId && { tenantId }) },
        });
        
        let counter = 1;
        while (slugExists) {
          categorySlug = `${dto.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${counter}`;
          slugExists = await this.prisma.category.findFirst({
            where: { slug: categorySlug, ...(tenantId && { tenantId }) },
          });
          counter++;
        }
        
        category = await this.prisma.category.create({
          data: {
            name: dto.category,
            slug: categorySlug,
            ...(tenantId && { tenantId }),
          },
        });
      }
      categoryId = category.id;
    }

    const updateData: any = {
      slug,
      updatedAt: new Date(), // Force update timestamp
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.compareAtPrice !== undefined) updateData.compareAtPrice = dto.compareAtPrice || null;
    if (dto.unit) updateData.unitSize = dto.unit;
    if (dto.unitSize) updateData.unitSize = dto.unitSize;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.barcode !== undefined) updateData.barcode = dto.barcode;
    if (dto.tags) updateData.tags = dto.tags;
    if (dto.isFeatured !== undefined) updateData.isFeatured = dto.isFeatured;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.orderCount !== undefined) updateData.orderCount = dto.orderCount;
    if (categoryId !== product.categoryId) updateData.categoryId = categoryId;
    if (dto.categoryId) updateData.categoryId = dto.categoryId;

    // Handle image updates
    if (dto.images !== undefined && Array.isArray(dto.images)) {
      console.log(`Updating images for product ${productId}: deleting old images, adding ${dto.images.length} new images`);
      
      // Delete existing images
      await this.prisma.productImage.deleteMany({
        where: { productId },
      });

      // Create new images if provided
      if (dto.images.length > 0) {
        updateData.images = {
          create: dto.images.map((img, index) => ({
            url: img.url,
            altText: img.altText || dto.name || product.name,
            sortOrder: img.sortOrder ?? index,
          })),
        };
      }
    } else {
      console.log(`Skipping image update for product ${productId}: images is ${dto.images === undefined ? 'undefined' : 'not an array'}`);
    }

    // Handle inventory updates
    if (dto.inventory) {
      updateData.inventory = {
        upsert: {
          create: {
            quantity: dto.inventory.quantity ?? 0,
            lowStockThreshold: dto.inventory.lowStockThreshold ?? 10,
            isTracked: dto.inventory.isTracked ?? true,
          },
          update: {
            quantity: dto.inventory.quantity,
            lowStockThreshold: dto.inventory.lowStockThreshold,
            isTracked: dto.inventory.isTracked,
          },
        },
      };
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        inventory: true,
        category: true,
      },
    });

    // Update inventory if stock is provided (legacy support)
    if (dto.stock !== undefined && !dto.inventory) {
      await this.prisma.inventory.update({
        where: { productId },
        data: { quantity: dto.stock },
      });
    }

    // Clear product cache
    await this.clearProductCache(productId, slug);

    return updated;
  }

  // Helper method to clear product caches
  private async clearProductCache(productId: string, slug?: string) {
    try {
      // Clear specific product caches
      await this.cacheManager.del(`product:${productId}`);
      if (slug) {
        await this.cacheManager.del(`product:slug:${slug}`);
      }
      
      // Clear products list caches - manually delete known cache key patterns
      // Since we can't iterate all keys easily, we'll clear common patterns
      const cachePatterns = [
        'products:{"where":{"deletedAt":null,"isActive":true}',
        'products:{"where":{"deletedAt":null}',
        'products:{"where":{"isActive":true}',
      ];
      
      // Try to clear cache keys with common patterns
      for (const pattern of cachePatterns) {
        // Delete keys that start with these patterns
        // Note: This is a best-effort approach since cache-manager doesn't support pattern deletion
        try {
          await this.cacheManager.del(pattern);
        } catch (e) {
          // Ignore errors for non-existent keys
        }
      }
      
      console.log(`🗑️  Cleared cache for product: ${productId}`);
    } catch (error) {
      console.warn('⚠️  Cache clear error:', error.message);
    }
  }

  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete by setting isActive to false
    await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    // Clear product cache
    await this.clearProductCache(productId, product.slug);

    return { message: 'Product deleted successfully' };
  }

  async toggleBestSeller(productId: string, isBestSeller: boolean) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { isBestSeller },
    });

    // Clear product cache
    await this.clearProductCache(productId, product.slug);

    return updated;
  }

  async updateInventory(productId: string, dto: UpdateInventoryDto) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });

    if (!inventory) {
      throw new NotFoundException('Product inventory not found');
    }

    let newQuantity = inventory.quantity;

    switch (dto.action) {
      case InventoryAction.ADD:
        newQuantity += dto.quantity;
        break;
      case InventoryAction.SUBTRACT:
        newQuantity -= dto.quantity;
        if (newQuantity < 0) {
          throw new BadRequestException('Stock cannot be negative');
        }
        break;
      case InventoryAction.SET:
        newQuantity = dto.quantity;
        break;
    }

    const updated = await this.prisma.inventory.update({
      where: { productId },
      data: { quantity: newQuantity },
      include: { product: true },
    });

    // Clear product cache after inventory update
    await this.clearProductCache(productId, inventory.product.slug);

    return {
      inventory: updated,
      previousQuantity: inventory.quantity,
      newQuantity,
      change: newQuantity - inventory.quantity,
    };
  }

  // ============================================
  // CATEGORY MANAGEMENT
  // ============================================

  async getAllCategories(tenantId?: string) {
    return this.prisma.category.findMany({
      where: { ...(tenantId && { tenantId }) },
      include: {
        children: true,
        parent: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(name: string, description?: string, image?: string, parentId?: string, tenantId?: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const existing = await this.prisma.category.findFirst({
      where: { slug, ...(tenantId && { tenantId }) },
    });

    if (existing) {
      throw new BadRequestException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId,
        ...(tenantId && { tenantId }),
      },
    });
  }

  async updateCategory(id: string, dto: any) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updateData: any = {};
    
    if (dto.name !== undefined) {
      updateData.name = dto.name;
      updateData.slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.parentId !== undefined) updateData.parentId = dto.parentId;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.products.length > 0) {
      throw new BadRequestException('Cannot delete category with products. Please reassign products first.');
    }

    if (category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories. Please delete subcategories first.');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }

  async toggleQuickCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        isQuickCategory: !category.isQuickCategory,
      },
    });

    return {
      message: `Category ${updated.isQuickCategory ? 'added to' : 'removed from'} quick categories`,
      category: updated,
    };
  }

  // ============================================
  // PRODUCT VARIANTS
  // ============================================

  async createVariant(productId: string, variantData: any) {
    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        name: variantData.name,
        sku: variantData.sku || `${productId}-${Date.now()}`,
        price: parseFloat(variantData.price),
        compareAtPrice: variantData.compareAtPrice ? parseFloat(variantData.compareAtPrice) : null,
        stock: parseInt(variantData.stock),
        isActive: variantData.isActive,
      },
    });

    // Clear product cache
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });
    if (product) {
      await this.clearProductCache(productId, product.slug);
    }

    return variant;
  }

  async updateVariant(productId: string, variantId: string, variantData: any) {
    // Handle type conversions and empty strings
    const updateData: any = {};
    
    if (variantData.name !== undefined) updateData.name = variantData.name;
    if (variantData.sku !== undefined) updateData.sku = variantData.sku;
    if (variantData.price !== undefined) updateData.price = parseFloat(variantData.price);
    if (variantData.compareAtPrice !== undefined) {
      updateData.compareAtPrice = variantData.compareAtPrice ? parseFloat(variantData.compareAtPrice) : null;
    }
    if (variantData.stock !== undefined) updateData.stock = parseInt(variantData.stock);
    if (variantData.isActive !== undefined) updateData.isActive = variantData.isActive;
    
    const variant = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    // Clear product cache
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });
    if (product) {
      await this.clearProductCache(productId, product.slug);
    }

    return variant;
  }

  async deleteVariant(productId: string, variantId: string) {
    await this.prisma.productVariant.delete({
      where: { id: variantId },
    });

    // Clear product cache
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });
    if (product) {
      await this.clearProductCache(productId, product.slug);
    }

    return { message: 'Variant deleted successfully' };
  }

  private parseStockQuantity(stockValue: any): number {
    console.log('🔍 Parsing stock value:', JSON.stringify(stockValue), 'Type:', typeof stockValue);
    
    if (stockValue === undefined || stockValue === null || stockValue === '') {
      console.log('❌ No stock value, returning 0');
      return 0;
    }
    
    if (typeof stockValue === 'string') {
      const stockLower = stockValue.toLowerCase().trim();
      console.log('📝 Stock string (lowercase):', stockLower);
      
      if (stockLower.includes('in stock') || stockLower === 'yes' || stockLower === 'in') {
        console.log('✅ Detected "In Stock", returning 100');
        return 100;
      } else if (stockLower.includes('out') || stockLower === 'no' || stockLower.includes('limited')) {
        console.log('⚠️  Detected "Out of Stock" or "Limited", returning 0');
        return 0;
      }
      const parsed = parseInt(stockValue) || 0;
      console.log('🔢 Parsed numeric value:', parsed);
      return parsed;
    }
    
    const parsed = parseInt(stockValue) || 0;
    console.log('🔢 Parsed non-string value:', parsed);
    return parsed;
  }

  private parseImages(row: any): any[] {
    const imageUrlRaw = row.imageUrl || row.ImageUrl || row.Image || row.image;
    const imageUrl = imageUrlRaw !== undefined ? String(imageUrlRaw).trim() : '';
    
    if (!imageUrl || imageUrl === '📷') {
      return [];
    }
    
    return imageUrl.split('|').map((url: string, index: number) => ({
      url: url.trim(),
      altText: row.name || row.Name,
      sortOrder: index,
    })).filter((img: any) => img.url && img.url !== '📷');
  }

  private async importSingleProduct(row: any) {
    console.log('📦 Importing single product:', row.name || row.Name);
    console.log('📊 Raw row data:', JSON.stringify(row));
    const images = this.parseImages(row);
    const stockQuantity = this.parseStockQuantity(row.stock || row.Stock);
    console.log('✅ Final stock quantity for product:', stockQuantity);

    const productData: any = {
      name: row.name || row.Name,
      description: row.description || row.Description || '',
      price: parseFloat(row.price || row.Price),
      compareAtPrice: row.compareAtPrice || row.CompareAtPrice ? parseFloat(row.compareAtPrice || row.CompareAtPrice) : undefined,
      category: row.category || row.Category,
      tags: row.tags || row.Tags ? (row.tags || row.Tags).split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      isFeatured: row.isFeatured === 'true' || row.IsFeatured === 'true',
      isActive: row.isActive !== 'false' && row.IsActive !== 'false',
      images,
      inventory: {
        quantity: stockQuantity,
        lowStockThreshold: 10,
        isTracked: true,
      },
    };

    await this.createProduct(productData);
  }

  private async importProductWithVariants(baseName: string, rows: any[]) {
    let created = 0;
    let updated = 0;
    let variants = 0;

    // Use first row for base product data
    const firstRow = rows[0];
    const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Check if base product exists
    let product = await this.prisma.product.findFirst({ where: { slug } });

    if (!product) {
      // Create base product
      const images = this.parseImages(firstRow);
      
      const productData: any = {
        name: baseName,
        description: firstRow.description || firstRow.Description || '',
        price: parseFloat(firstRow.price || firstRow.Price),
        category: firstRow.category || firstRow.Category,
        tags: firstRow.tags || firstRow.Tags ? (firstRow.tags || firstRow.Tags).split(',').map((t: string) => t.trim()) : [],
        isFeatured: false,
        isActive: true,
        images,
        inventory: {
          quantity: 0,
          lowStockThreshold: 10,
          isTracked: true,
        },
      };

      product = await this.createProduct(productData);
      created = 1;
    } else {
      updated = 1;
    }

    // Create/update variants for each size
    for (const row of rows) {
      const variantName = row.detectedSize || 'Standard';
      const stockQuantity = this.parseStockQuantity(row.stock || row.Stock);
      const images = this.parseImages(row);
      const imageUrl = images.length > 0 ? images[0].url : undefined;

      // Check if variant exists
      const existingVariant = await this.prisma.productVariant.findFirst({
        where: {
          productId: product.id,
          name: variantName,
        },
      });

      const variantData = {
        name: variantName,
        sku: row.sku || row.SKU || `${product.id}-${variantName}`,
        price: parseFloat(row.price || row.Price),
        compareAtPrice: row.compareAtPrice ? parseFloat(row.compareAtPrice) : undefined,
        stock: stockQuantity,
        imageUrl,
        isActive: true,
      };

      if (existingVariant) {
        await this.prisma.productVariant.update({
          where: { id: existingVariant.id },
          data: variantData,
        });
      } else {
        await this.prisma.productVariant.create({
          data: {
            ...variantData,
            productId: product.id,
          },
        });
        variants++;
      }
    }

    return { created, updated, variants };
  }

  async importProductsFromCSV(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }

    const results: any[] = [];
    const errors: any[] = [];
    let createdCount = 0;
    let updatedCount = 0;
    let variantCount = 0;
    let errorCount = 0;

    return new Promise((resolve, reject) => {
      const stream = Readable.from(file.buffer.toString());
      let headerValidated = false;
      
      stream
        .pipe(csvParser())
        .on('headers', (headers) => {
          // Validate CSV format
          const requiredColumns = ['Name', 'Category', 'Price'];
          const hasRequiredColumns = requiredColumns.every(col => 
            headers.some(h => h.toLowerCase() === col.toLowerCase())
          );
          
          if (!hasRequiredColumns) {
            reject(new BadRequestException({
              message: 'Invalid CSV format - Missing required columns',
              details: {
                error: 'Missing required columns',
                required: requiredColumns,
                found: headers,
                help: 'Your CSV must have these columns: Name, Category, Price',
                optional: 'Description, Stock, Image, SKU, Barcode',
                example: 'Name,Category,Price,Stock,Description\nProduct Name,Category Name,9.99,100,Product description'
              }
            }));
            return;
          }
          
          // Check for malformed header (entire row in quotes)
          if (headers.length === 1 && headers[0].includes(',')) {
            reject(new BadRequestException({
              message: 'Malformed CSV file - Header row is wrapped in quotes',
              details: {
                error: 'Each row is wrapped in quotes instead of having separate columns',
                found: headers[0],
                help: 'Remove the quotes wrapping each entire row. Each column value should be separate.',
                correct: 'Name,Category,Price,Stock,Description',
                incorrect: '"Name,Category,Price,Stock,Description"',
                howToFix: 'Open your CSV in a text editor and remove the quotes at the start and end of each line.'
              }
            }));
            return;
          }
          
          headerValidated = true;
        })
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', async () => {
          if (!headerValidated) {
            reject(new BadRequestException('CSV file could not be parsed'));
            return;
          }

          try {
            // Group products by base name for variant detection
            const productGroups = new Map<string, any[]>();
            
            for (const row of results) {
              const fullName = row.name || row.Name;
              if (!fullName) continue;
              
              // Extract base name and size
              const sizePattern = /(\d+(?:\.\d+)?\s*(?:kg|g|l|ml|cl|oz|lb|pack)|x\d+\s*pack)/i;
              const match = fullName.match(sizePattern);
              
              let baseName = fullName;
              let size = null;
              
              if (match) {
                size = match[1].trim();
                baseName = fullName.replace(sizePattern, '').trim();
              }
              
              if (!productGroups.has(baseName)) {
                productGroups.set(baseName, []);
              }
              productGroups.get(baseName)!.push({ ...row, detectedSize: size });
            }

            // Process each product group
            for (const [baseName, rows] of productGroups.entries()) {
              try {
                // Check if all rows are duplicates (same exact name, no size variations)
                const allSameName = rows.every(r => !r.detectedSize);
                
                if (rows.length === 1 && !rows[0].detectedSize) {
                  // Single product with no size variant
                  await this.importSingleProduct(rows[0]);
                  createdCount++;
                } else if (allSameName && rows.length > 1) {
                  // Multiple rows with exact same name - just update the first one with latest data
                  const latestRow = rows[rows.length - 1]; // Use last occurrence
                  await this.importSingleProduct(latestRow);
                  createdCount++;
                } else {
                  // Multiple variants or single product with size
                  const result = await this.importProductWithVariants(baseName, rows);
                  createdCount += result.created;
                  updatedCount += result.updated;
                  variantCount += result.variants;
                }
              } catch (error) {
                errorCount++;
                errors.push({
                  product: baseName,
                  error: error.message,
                });
              }
            }

            // Audit log for CSV import
            await this.auditService.log({
              userId: 'system', // Will be updated when we add user context
              action: 'CSV_IMPORT',
              entity: 'Product',
              entityId: 'bulk',
              changes: {
                totalRows: results.length,
                created: createdCount,
                updated: updatedCount,
                variants: variantCount,
                errors: errorCount,
              },
            });

            resolve({
              message: `CSV import completed: ${createdCount} products, ${variantCount} variants, ${updatedCount} updated, ${errorCount} errors`,
              totalRows: results.length,
              createdCount,
              updatedCount,
              variantCount,
              successCount: createdCount + updatedCount,
              errorCount,
              errors: errors.length > 0 ? errors : undefined,
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(new BadRequestException({
            message: 'Failed to parse CSV file',
            details: {
              error: error.message,
              help: 'Make sure your CSV file is properly formatted. Each row should have values separated by commas, not wrapped in quotes.',
              example: 'Name,Category,Price\nProduct 1,Category A,9.99\nProduct 2,Category B,14.99',
              commonIssues: [
                'Entire rows wrapped in quotes: "Name,Category,Price" ❌',
                'Missing required columns: Name, Category, Price',
                'File encoding issues - save as UTF-8'
              ]
            }
          }));
        });
    });
  }

  async exportProductsToCSV(includeInactive = false, tenantId?: string) {
    // Fetch all products with their relationships
    const products = await this.prisma.product.findMany({
      where: { ...(includeInactive ? {} : { isActive: true }), ...(tenantId && { tenantId }) },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        inventory: true,
        variants: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // CSV Headers - All fields needed to create/update a product
    const headers = [
      'id',
      'name',
      'variantName',
      'description',
      'price',
      'compareAtPrice',
      'category',
      'categoryId',
      'imageUrl',
      'tags',
      'unitSize',
      'sku',
      'barcode',
      'stock',
      'lowStockThreshold',
      'trackInventory',
      'isFeatured',
      'isActive',
    ];

    // Build CSV rows - flatten variants into separate rows
    const rows = products.flatMap((product) => {
      const baseImageUrls = product.images?.map(img => img.url).join('|') || '';
      const tags = product.tags?.join(',') || '';
      const lowStockThreshold = product.inventory?.lowStockThreshold || 10;
      const trackInventory = product.inventory?.isTracked !== false ? 'true' : 'false';

      // If product has variants, export each variant as a row
      if (product.variants && product.variants.length > 0) {
        return product.variants.map((variant) => [
          variant.id,
          this.escapeCsvValue(product.name),
          this.escapeCsvValue(variant.name),
          this.escapeCsvValue(product.description || ''),
          variant.price.toString(),
          variant.compareAtPrice?.toString() || '',
          this.escapeCsvValue(product.category?.name || ''),
          product.categoryId || '',
          variant.imageUrl || baseImageUrls,
          this.escapeCsvValue(tags),
          product.unitSize || '',
          variant.sku || '',
          product.barcode || '',
          variant.stock,
          lowStockThreshold,
          trackInventory,
          product.isFeatured ? 'true' : 'false',
          variant.isActive ? 'true' : 'false',
        ].join(','));
      }

      // If no variants, export the product itself
      const stock = product.inventory?.quantity || 0;
      return [[
        product.id,
        this.escapeCsvValue(product.name),
        '', // no variant name
        this.escapeCsvValue(product.description || ''),
        product.price.toString(),
        product.compareAtPrice?.toString() || '',
        this.escapeCsvValue(product.category?.name || ''),
        product.categoryId || '',
        baseImageUrls,
        this.escapeCsvValue(tags),
        product.unitSize || '',
        product.sku || '',
        product.barcode || '',
        stock,
        lowStockThreshold,
        trackInventory,
        product.isFeatured ? 'true' : 'false',
        product.isActive ? 'true' : 'false',
      ].join(',')];
    });

    // Combine headers and rows
    return [headers.join(','), ...rows].join('\n');
  }

  private escapeCsvValue(value: string): string {
    if (!value) return '';
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  }

  // ============================================
  // ORDER MANAGEMENT
  // ============================================

  async getAllOrders(page = 1, limit = 20, status?: string, isPhoneOrder?: boolean, tenantId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { ...(tenantId && { tenantId }) };

    if (status) {
      where.status = status;
    }

    if (isPhoneOrder !== undefined) {
      where.isPhoneOrder = isPhoneOrder;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          address: true,
          deliverySlot: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderDetails(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        deliverySlot: true,
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: string) {
    // Validate order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
    });

    // Create status history entry
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: status as any,
        notes: `Status updated to ${status}`,
      },
    });

    return updatedOrder;
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  async getAllUsers(page = 1, limit = 20, tenantId?: string) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: true,
            payment: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ============================================
  // DASHBOARD STATS
  // ============================================

  async getDashboardStats(tenantId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders,
      lowStockProducts,
      ordersByStatus,
      newOrdersToday,
      pendingPayment,
      todayRevenue,
      deliverySlots,
    ] = await Promise.all([
      // Total orders
      this.prisma.order.count({ where: { ...(tenantId && { tenantId }) } }),

      // Total revenue
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          ...(tenantId && { tenantId }),
          payment: {
            status: 'SUCCEEDED',
          },
        },
      }),

      // Total customers
      this.prisma.user.count({
        where: { role: 'CUSTOMER', ...(tenantId && { tenantId }) },
      }),

      // Total products
      this.prisma.product.count({
        where: { isActive: true, ...(tenantId && { tenantId }) },
      }),

      // Recent orders (last 10)
      this.prisma.order.findMany({
        where: { ...(tenantId && { tenantId }) },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          payment: {
            select: {
              status: true,
            },
          },
        },
      }),

      // Low stock products (< 10 units)
      this.prisma.inventory.findMany({
        where: {
          quantity: {
            lt: 10,
          },
          product: {
            isActive: true,
            ...(tenantId && { tenantId }),
          },
        },
        include: {
          product: true,
        },
        orderBy: { quantity: 'asc' },
        take: 10,
      }),

      // Orders by status
      this.prisma.order.groupBy({
        by: ['status'],
        where: { ...(tenantId && { tenantId }) },
        _count: true,
      }),

      // NEW: Orders created today
      this.prisma.order.count({
        where: {
          ...(tenantId && { tenantId }),
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // NEW: Orders with pending payment
      this.prisma.order.count({
        where: {
          ...(tenantId && { tenantId }),
          payment: {
            status: 'PENDING',
          },
        },
      }),

      // NEW: Today's revenue
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          ...(tenantId && { tenantId }),
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          payment: {
            status: {
              not: 'FAILED',
            },
          },
        },
      }),

      // NEW: Delivery slots utilization
      this.prisma.deliverySlot.findMany({
        where: { isActive: true, ...(tenantId && { tenantId }) },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    // Calculate delivery slot utilization (for today)
    const slotsWithUsage = await Promise.all(
      deliverySlots.map(async (slot) => {
        const used = await this.prisma.order.count({
          where: {
            deliverySlotId: slot.id,
            status: {
              notIn: ['CANCELLED', 'DELIVERED', 'COLLECTED', 'REFUNDED'],
            },
          },
        });

        return {
          label: `${slot.startTime}-${slot.endTime}`,
          time: `${slot.startTime}-${slot.endTime}`,
          used,
          capacity: slot.capacity,
        };
      }),
    );

    return {
      // Legacy fields
      totalOrders,
      totalRevenue: totalRevenue._sum.total?.toString() || '0',
      totalCustomers,
      totalProducts,
      recentOrders,
      topProducts: [], // Can be implemented later
      
      // NEW: Dashboard metrics
      newOrdersToday,
      pendingPayment,
      lowStockItems: lowStockProducts.length,
      todayRevenue: todayRevenue._sum.total?.toString() || '0',
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      deliverySlots: slotsWithUsage,
    };
  }

  // ============================================
  // NEW ENDPOINTS
  // ============================================

  async toggleProductStatus(productId: string, isActive: boolean) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { isActive },
    });
  }

  async duplicateProduct(productId: string, nameSuffix: string, tenantId?: string) {
    const sourceProduct = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        inventory: true,
      },
    });

    if (!sourceProduct) {
      throw new NotFoundException('Product not found');
    }

    // Generate new name and slug
    const newName = sourceProduct.name + nameSuffix;
    const baseSlug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.product.findFirst({ where: { slug, ...(tenantId && { tenantId }) } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create duplicate product
    const newProduct = await this.prisma.product.create({
      data: {
        name: newName,
        slug,
        ...(tenantId && { tenantId }),
        description: sourceProduct.description,
        price: sourceProduct.price,
        compareAtPrice: sourceProduct.compareAtPrice,
        categoryId: sourceProduct.categoryId,
        isActive: false, // Duplicates start as inactive
        isFeatured: false,
        // Copy images
        images: {
          create: sourceProduct.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder,
          })),
        },
        // Copy inventory settings (but reset quantity to 0)
        inventory: sourceProduct.inventory
          ? {
              create: {
                quantity: 0,
                lowStockThreshold: sourceProduct.inventory.lowStockThreshold,
                isTracked: sourceProduct.inventory.isTracked,
              },
            }
          : undefined,
      },
      include: {
        category: true,
        images: true,
        inventory: true,
      },
    });

    return newProduct;
  }

  async markOrderPaid(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.payment?.paymentMethod !== 'CASH_ON_DELIVERY' && order.payment?.paymentMethod !== 'PAY_IN_STORE') {
      throw new BadRequestException('Only COD and Pay in Store orders can be marked as paid');
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: 'SUCCEEDED',
        paidAt: new Date(),
      },
    });

    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        user: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  async processRefund(orderId: string, amount: number, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.payment?.status !== 'SUCCEEDED') {
      throw new BadRequestException('Can only refund succeeded payments');
    }

    const orderTotal = parseFloat(order.total.toString());
    if (amount > orderTotal) {
      throw new BadRequestException('Refund amount cannot exceed order total');
    }

    // TODO: Integrate with Stripe API to process actual refund
    // const stripeRefund = await stripe.refunds.create({
    //   payment_intent: order.payment.stripePaymentIntentId,
    //   amount: Math.round(amount * 100), // Convert to cents
    // });

    // Create refund record (if Refund model exists in schema)
    // const refund = await this.prisma.refund.create({
    //   data: {
    //     orderId,
    //     amount: amount.toString(),
    //     reason,
    //     status: 'SUCCEEDED',
    //     stripeRefundId: stripeRefund.id,
    //   },
    // });

    // For now, just return refund data without saving to DB
    const refund = {
      id: `refund-${Date.now()}`,
      orderId,
      amount: amount.toString(),
      reason,
      status: 'SUCCEEDED',
      createdAt: new Date(),
    };

    // Update payment status if fully refunded
    if (amount >= orderTotal) {
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: { status: 'REFUNDED' },
      });
    } else {
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: { status: 'PARTIALLY_REFUNDED' },
      });
    }

    // TODO: Send email notification to customer

    return refund;
  }

  async assignDriver(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.fulfillmentType !== 'DELIVERY') {
      throw new BadRequestException('Can only assign drivers to delivery orders');
    }

    // TODO: Verify driver exists and is available
    // const driver = await this.prisma.user.findUnique({
    //   where: { id: driverId, role: 'DRIVER' },
    // });
    // if (!driver) {
    //   throw new NotFoundException('Driver not found');
    // }

    // Update order with driver
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        // driverId, // Add this field to schema if needed
      },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });

    // TODO: Send SMS notification to driver
    // TODO: Send push notification via driver app

    return {
      ...updatedOrder,
      driverId,
      driver: {
        id: driverId,
        name: 'Driver Name', // TODO: Get from database
        phone: '+44 7700 900000', // TODO: Get from database
      },
    };
  }

  // ============================================
  // DELIVERY MANAGEMENT
  // ============================================

  // Delivery Zones
  async getAllDeliveryZones(tenantId?: string) {
    const zones = await this.prisma.deliveryZone.findMany({
      where: { ...(tenantId && { tenantId }) },
      orderBy: { name: 'asc' },
    });
    return zones;
  }

  async createDeliveryZone(data: any, tenantId?: string) {
    const zone = await this.prisma.deliveryZone.create({
      data: {
        name: data.name,
        postcodePrefix: data.postcodePrefix,
        deliveryFee: data.deliveryFee,
        minOrderValue: data.minOrderValue,
        freeDeliveryThreshold: data.freeDeliveryThreshold || null,
        isActive: data.isActive ?? true,
        ...(tenantId && { tenantId }),
      },
    });
    return zone;
  }

  async updateDeliveryZone(id: string, data: any) {
    const zone = await this.prisma.deliveryZone.update({
      where: { id },
      data: {
        name: data.name,
        postcodePrefix: data.postcodePrefix,
        deliveryFee: data.deliveryFee,
        minOrderValue: data.minOrderValue,
        freeDeliveryThreshold: data.freeDeliveryThreshold || null,
        isActive: data.isActive,
      },
    });
    return zone;
  }

  async deleteDeliveryZone(id: string) {
    await this.prisma.deliveryZone.delete({
      where: { id },
    });
    return { message: 'Zone deleted successfully' };
  }

  // Delivery Slots
  async getAllDeliverySlots(date?: string, tenantId?: string) {
    const where: any = { ...(tenantId && { tenantId }) };
    
    if (date) {
      where.date = new Date(date);
    }

    const slots = await this.prisma.deliverySlot.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: {
                  notIn: ['CANCELLED', 'REFUNDED'],
                },
              },
            },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return slots.map(slot => ({
      ...slot,
      bookedCount: slot._count.orders,
    }));
  }

  async createDeliverySlot(data: any, tenantId?: string) {
    const slot = await this.prisma.deliverySlot.create({
      data: {
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: parseInt(data.capacity),
        isActive: data.isActive ?? true,
        ...(tenantId && { tenantId }),
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    return {
      ...slot,
      bookedCount: slot._count.orders,
    };
  }

  async updateDeliverySlot(id: string, data: any) {
    const slot = await this.prisma.deliverySlot.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity ? parseInt(data.capacity) : undefined,
        isActive: data.isActive,
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    return {
      ...slot,
      bookedCount: slot._count.orders,
    };
  }

  async deleteDeliverySlot(id: string) {
    // Check if slot has bookings
    const slot = await this.prisma.deliverySlot.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (slot._count.orders > 0) {
      throw new BadRequestException(`Cannot delete slot with ${slot._count.orders} existing bookings`);
    }

    await this.prisma.deliverySlot.delete({
      where: { id },
    });

    return { message: 'Slot deleted successfully' };
  }

  // ============================================
  // STAFF MANAGEMENT
  // ============================================

  async createStaff(dto: CreateStaffDto, adminId: string, tenantId?: string) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create staff user
    const staff = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        emailVerified: true, // Staff accounts are pre-verified
        isActive: true,
        ...(tenantId && { tenantId }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Audit log
    await this.auditService.log({
      userId: adminId,
      action: 'CREATE_STAFF',
      entity: 'User',
      entityId: staff.id,
      changes: {
        email: staff.email,
        role: staff.role,
        name: `${staff.firstName} ${staff.lastName}`,
      },
    });

    console.log(`👤 Staff created: ${staff.email} (${staff.role})`);

    return staff;
  }

  async getAllStaff(page = 1, limit = 50, tenantId?: string) {
    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: {
            in: ['STAFF', 'PICKER', 'DRIVER'],
          },
          ...(tenantId && { tenantId }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          role: {
            in: ['STAFF', 'PICKER', 'DRIVER'],
          },
          ...(tenantId && { tenantId }),
        },
      }),
    ]);

    return {
      staff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStaffById(id: string) {
    const staff = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        permissions: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    if (!['STAFF', 'PICKER', 'DRIVER'].includes(staff.role)) {
      throw new BadRequestException('User is not a staff member');
    }

    return staff;
  }

  async updateStaff(id: string, dto: UpdateStaffDto, adminId: string) {
    const staff = await this.getStaffById(id);

    // If email is being updated, check if it's already in use
    if (dto.email && dto.email !== staff.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Audit log
    await this.auditService.log({
      userId: adminId,
      action: 'UPDATE_STAFF',
      entity: 'User',
      entityId: id,
      changes: {
        before: staff,
        after: dto,
      },
    });

    console.log(`👤 Staff updated: ${updated.email}`);

    return updated;
  }

  async deleteStaff(id: string, adminId: string) {
    const staff = await this.getStaffById(id);

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Audit log
    await this.auditService.log({
      userId: adminId,
      action: 'DELETE_STAFF',
      entity: 'User',
      entityId: id,
      changes: {
        email: staff.email,
        role: staff.role,
      },
    });

    console.log(`👤 Staff deleted: ${staff.email}`);

    return { message: 'Staff member deleted successfully' };
  }

  async resetStaffPassword(id: string, newPassword: string, adminId: string) {
    const staff = await this.getStaffById(id);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Audit log
    await this.auditService.log({
      userId: adminId,
      action: 'RESET_STAFF_PASSWORD',
      entity: 'User',
      entityId: id,
      changes: {
        email: staff.email,
      },
    });

    console.log(`🔐 Password reset for staff: ${staff.email}`);

    return { message: 'Password reset successfully' };
  }

  async updateStaffPermissions(id: string, permissions: string[], adminId: string) {
    const staff = await this.getStaffById(id);

    // Validate permissions
    const validPermissions = ['inventory', 'customers'];
    const invalidPerms = permissions.filter(p => !validPermissions.includes(p));
    
    if (invalidPerms.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${invalidPerms.join(', ')}`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { permissions },
    });

    // Audit log
    await this.auditService.log({
      userId: adminId,
      action: 'UPDATE_STAFF_PERMISSIONS',
      entity: 'User',
      entityId: id,
      changes: {
        email: staff.email,
        oldPermissions: staff.permissions,
        newPermissions: permissions,
      },
    });

    console.log(`🔐 Permissions updated for staff: ${staff.email} - ${permissions.join(', ')}`);

    return {
      message: 'Permissions updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        permissions: updated.permissions,
      },
    };
  }

  // ============================================
  // INVENTORY STATS
  // ============================================

  async getInventoryStats(tenantId?: string) {
    // Get all products with their variants
    const products = await this.prisma.product.findMany({
      where: { isActive: true, ...(tenantId && { tenantId }) },
      include: {
        variants: {
          where: { isActive: true },
        },
        inventory: true,
      },
    });

    let totalItems = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of products) {
      const threshold = product.inventory?.lowStockThreshold || 10;
      
      if (product.variants && product.variants.length > 0) {
        // For products with variants, count each variant
        for (const variant of product.variants) {
          totalItems++;
          if (variant.stock === 0) {
            outOfStockCount++;
          } else if (variant.stock <= threshold) {
            lowStockCount++;
          }
        }
      } else {
        // For products without variants, count the product itself
        totalItems++;
        if (product.inventory) {
          const stock = product.inventory.quantity;
          if (stock === 0) {
            outOfStockCount++;
          } else if (stock <= threshold) {
            lowStockCount++;
          }
        }
      }
    }

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
    };
  }
}
