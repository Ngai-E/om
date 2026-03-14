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

  async getBadgeCounts() {
    // Count pending orders (RECEIVED status - newly placed orders)
    const pendingOrders = await this.prisma.order.count({
      where: {
        status: 'RECEIVED',
      },
    });

    // Count low stock items (inventory quantity <= 10)
    const lowStockItems = await this.prisma.inventory.count({
      where: {
        quantity: {
          lte: 10,
        },
      },
    });

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
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};

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

  async createProduct(dto: CreateProductDto) {
    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    const existing = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException(`Product with slug "${slug}" already exists`);
    }

    // Handle category - support both categoryId and legacy category name
    let categoryId = dto.categoryId;
    if (!categoryId && dto.category) {
      // Legacy: Find or create category by name
      let category = await this.prisma.category.findFirst({
        where: { name: dto.category },
      });

      if (!category) {
        const categorySlug = dto.category
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        category = await this.prisma.category.create({
          data: {
            name: dto.category,
            slug: categorySlug,
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

    // Clear cache for product lists (new product added)
    console.log('🗑️  Cleared product list cache (new product created)');

    return product;
  }

  async updateProduct(productId: string, dto: UpdateProductDto) {
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
      const existing = await this.prisma.product.findUnique({
        where: { slug },
      });

      if (existing && existing.id !== productId) {
        throw new BadRequestException(`Product with slug "${slug}" already exists`);
      }
    }

    // Handle category update
    let categoryId = product.categoryId;
    if (dto.category) {
      let category = await this.prisma.category.findFirst({
        where: { name: dto.category },
      });

      if (!category) {
        const categorySlug = dto.category
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        category = await this.prisma.category.create({
          data: {
            name: dto.category,
            slug: categorySlug,
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
      
      // Note: We can't easily clear all products:* keys without Redis SCAN
      // For now, they will expire after 5 minutes
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
    let errorCount = 0;

    return new Promise((resolve, reject) => {
      const stream = Readable.from(file.buffer.toString());
      
      stream
        .pipe(csvParser())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', async () => {
          // Process each row
          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            try {
              // Parse the CSV row - handle empty/missing imageUrl field
              const imageUrlRaw = row.imageUrl || row.ImageUrl;
              const imageUrl = imageUrlRaw !== undefined ? String(imageUrlRaw).trim() : '';
              const images = imageUrl 
                ? imageUrl.split('|').map((url: string, index: number) => ({
                    url: url.trim(),
                    altText: row.name || row.Name,
                    sortOrder: index,
                  })).filter((img: any) => img.url) // Filter out empty URLs
                : [];
              
              console.log(`Row ${i + 1}: imageUrl="${imageUrl}", parsed ${images.length} images`);

              const productData: any = {
                name: row.name || row.Name,
                description: row.description || row.Description || '',
                price: parseFloat(row.price || row.Price),
                compareAtPrice: row.compareAtPrice || row.CompareAtPrice ? parseFloat(row.compareAtPrice || row.CompareAtPrice) : undefined,
                category: row.category || row.Category,
                categoryId: row.categoryId || row.CategoryId || undefined,
                unitSize: row.unitSize || row.UnitSize || row.unit || row.Unit || undefined,
                sku: row.sku || row.SKU || undefined,
                barcode: row.barcode || row.Barcode || undefined,
                tags: row.tags || row.Tags ? (row.tags || row.Tags).split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
                isFeatured: row.isFeatured === 'true' || row.IsFeatured === 'true' || row.isFeatured === '1',
                isActive: row.isActive !== 'false' && row.IsActive !== 'false' && row.isActive !== '0',
                images: images, // Always pass images array (even if empty) to trigger update
                inventory: {
                  quantity: row.stock || row.Stock ? parseInt(row.stock || row.Stock) : 0,
                  lowStockThreshold: row.lowStockThreshold || row.LowStockThreshold ? parseInt(row.lowStockThreshold || row.LowStockThreshold) : 10,
                  isTracked: row.trackInventory === 'true' || row.TrackInventory === 'true' || row.trackInventory === '1' || row.trackInventory !== 'false',
                },
              };

              // Check if product exists (by ID, SKU, or name)
              const productId = row.id || row.Id;
              let existingProduct = null;

              if (productId) {
                existingProduct = await this.prisma.product.findUnique({ where: { id: productId } });
              }
              
              if (!existingProduct && productData.sku) {
                existingProduct = await this.prisma.product.findUnique({ where: { sku: productData.sku } });
              }

              if (!existingProduct) {
                const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                existingProduct = await this.prisma.product.findUnique({ where: { slug } });
              }

              if (existingProduct) {
                // Update existing product
                console.log(`Updating product ${existingProduct.id} with ${productData.images?.length || 0} images`);
                await this.updateProduct(existingProduct.id, productData);
                updatedCount++;
              } else {
                // Create new product
                console.log(`Creating new product with ${productData.images?.length || 0} images`);
                await this.createProduct(productData);
                createdCount++;
              }
            } catch (error) {
              errorCount++;
              errors.push({
                row: i + 2, // +2 because of 0-index and header row
                data: row,
                error: error.message,
              });
            }
          }

          resolve({
            message: 'CSV import completed',
            totalRows: results.length,
            createdCount,
            updatedCount,
            successCount: createdCount + updatedCount,
            errorCount,
            errors: errors.length > 0 ? errors : undefined,
          });
        })
        .on('error', (error) => {
          reject(new BadRequestException(`CSV parsing error: ${error.message}`));
        });
    });
  }

  async exportProductsToCSV(includeInactive = false) {
    // Fetch all products with their relationships
    const products = await this.prisma.product.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        inventory: true,
      },
      orderBy: { name: 'asc' },
    });

    // CSV Headers - All fields needed to create/update a product
    const headers = [
      'id',
      'name',
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

    // Build CSV rows
    const rows = products.map((product) => {
      const imageUrls = product.images?.map(img => img.url).join('|') || '';
      const stock = product.inventory?.quantity || 0;
      const lowStockThreshold = product.inventory?.lowStockThreshold || 10;
      const trackInventory = product.inventory?.isTracked !== false ? 'true' : 'false';
      const tags = product.tags?.join(',') || '';

      return [
        product.id,
        this.escapeCsvValue(product.name),
        this.escapeCsvValue(product.description || ''),
        product.price.toString(),
        product.compareAtPrice?.toString() || '',
        this.escapeCsvValue(product.category?.name || ''),
        product.categoryId || '',
        imageUrls,
        this.escapeCsvValue(tags),
        product.unitSize || '',
        product.sku || '',
        product.barcode || '',
        stock,
        lowStockThreshold,
        trackInventory,
        product.isFeatured ? 'true' : 'false',
        product.isActive ? 'true' : 'false',
      ].join(',');
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

  async getAllOrders(page = 1, limit = 20, status?: string, isPhoneOrder?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};

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

  async getAllUsers(page = 1, limit = 20) {
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

  async getDashboardStats() {
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
      this.prisma.order.count(),

      // Total revenue
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          payment: {
            status: 'SUCCEEDED',
          },
        },
      }),

      // Total customers
      this.prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),

      // Total products
      this.prisma.product.count({
        where: { isActive: true },
      }),

      // Recent orders (last 10)
      this.prisma.order.findMany({
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
        _count: true,
      }),

      // NEW: Orders created today
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // NEW: Orders with pending payment
      this.prisma.order.count({
        where: {
          payment: {
            status: 'PENDING',
          },
        },
      }),

      // NEW: Today's revenue
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
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
        where: { isActive: true },
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

  async duplicateProduct(productId: string, nameSuffix: string) {
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
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create duplicate product
    const newProduct = await this.prisma.product.create({
      data: {
        name: newName,
        slug,
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

    if (order.payment?.paymentMethod !== 'CASH_ON_DELIVERY') {
      throw new BadRequestException('Only COD orders can be marked as paid');
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
  async getAllDeliveryZones() {
    const zones = await this.prisma.deliveryZone.findMany({
      orderBy: { name: 'asc' },
    });
    return zones;
  }

  async createDeliveryZone(data: any) {
    const zone = await this.prisma.deliveryZone.create({
      data: {
        name: data.name,
        postcodePrefix: data.postcodePrefix,
        deliveryFee: data.deliveryFee,
        minOrderValue: data.minOrderValue,
        freeDeliveryThreshold: data.freeDeliveryThreshold || null,
        isActive: data.isActive ?? true,
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
  async getAllDeliverySlots(date?: string) {
    const where: any = {};
    
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

  async createDeliverySlot(data: any) {
    const slot = await this.prisma.deliverySlot.create({
      data: {
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: parseInt(data.capacity),
        isActive: data.isActive ?? true,
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

  async createStaff(dto: CreateStaffDto, adminId: string) {
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

  async getAllStaff(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: {
            in: ['STAFF', 'PICKER', 'DRIVER'],
          },
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
}
