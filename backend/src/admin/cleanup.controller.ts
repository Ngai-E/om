import { Controller, Post, Body, UseGuards, UnauthorizedException, BadRequestException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@ApiTags('admin')
@Controller('admin/cleanup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class CleanupController {
  constructor(private prisma: PrismaService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview what will be deleted (Admin only)' })
  async previewCleanup(@Req() req: Request, @Body() body: { 
    code: string;
    components?: {
      customers?: boolean;
      orders?: boolean;
      carts?: boolean;
      addresses?: boolean;
      deliverySlots?: boolean;
      auditLogs?: boolean;
      products?: boolean;
    };
  }) {
    const { code, components = {} } = body;
    const tenantId = (req as any).tenantId;
    const DEVELOPER_CODE = process.env.CLEANUP_SECRET_CODE;

    if (!DEVELOPER_CODE || code !== DEVELOPER_CODE) {
      throw new BadRequestException('Invalid cleanup code. Please check your secret code and try again.');
    }

    // Default all to true if not specified
    const cleanupConfig = {
      customers: components.customers !== false,
      orders: components.orders !== false,
      carts: components.carts !== false,
      addresses: components.addresses !== false,
      deliverySlots: components.deliverySlots !== false,
      auditLogs: components.auditLogs !== false,
      products: components.products !== false,
    };

    const tw: any = tenantId ? { tenantId } : {};
    const willDelete: any = {};

    // Count based on selected components
    if (cleanupConfig.customers) {
      willDelete.customers = await this.prisma.user.count({
        where: { role: 'CUSTOMER', ...tw },
      });
    }

    if (cleanupConfig.orders) {
      willDelete.orders = await this.prisma.order.count({ where: { ...tw } });
    }

    if (cleanupConfig.carts) {
      willDelete.carts = await this.prisma.cart.count({ where: { ...tw } });
      willDelete.cartItems = await this.prisma.cartItem.count({
        where: { cart: { ...tw } },
      });
    }

    if (cleanupConfig.addresses) {
      willDelete.addresses = await this.prisma.address.count({
        where: { user: { ...tw } },
      });
    }

    if (cleanupConfig.deliverySlots) {
      willDelete.deliverySlots = await this.prisma.deliverySlot.count({ where: { ...tw } });
    }

    if (cleanupConfig.auditLogs) {
      willDelete.auditLogs = await this.prisma.auditLog.count({ where: { ...tw } });
    }

    if (cleanupConfig.products) {
      willDelete.products = await this.prisma.product.count({ where: { ...tw } });
      willDelete.productVariants = await this.prisma.productVariant.count({
        where: { product: { ...tw } },
      });
    }

    const warnings = [];
    if (cleanupConfig.customers) warnings.push('customers');
    if (cleanupConfig.orders) warnings.push('orders');
    if (cleanupConfig.carts) warnings.push('carts');
    if (cleanupConfig.addresses) warnings.push('addresses');
    if (cleanupConfig.deliverySlots) warnings.push('delivery slots');
    if (cleanupConfig.auditLogs) warnings.push('audit logs');
    if (cleanupConfig.products) warnings.push('products');

    return {
      willDelete,
      selectedComponents: cleanupConfig,
      warning: warnings.length > 0 
        ? `⚠️ This will delete: ${warnings.join(', ')}. Admin and staff accounts will be preserved.`
        : '⚠️ No components selected for cleanup.',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Clean database - DANGER ZONE (Admin only)' })
  async cleanupDatabase(@Req() req: Request, @Body() body: {
    code: string;
    components?: {
      customers?: boolean;
      orders?: boolean;
      carts?: boolean;
      addresses?: boolean;
      deliverySlots?: boolean;
      auditLogs?: boolean;
      products?: boolean;
    };
  }) {
    const { code, components = {} } = body;
    const tenantId = (req as any).tenantId;
    const DEVELOPER_CODE = process.env.CLEANUP_SECRET_CODE;

    if (!DEVELOPER_CODE || code !== DEVELOPER_CODE) {
      throw new BadRequestException('Invalid cleanup code. Please check your secret code and try again.');
    }

    // Default all to true if not specified
    const cleanupConfig = {
      customers: components.customers !== false,
      orders: components.orders !== false,
      carts: components.carts !== false,
      addresses: components.addresses !== false,
      deliverySlots: components.deliverySlots !== false,
      auditLogs: components.auditLogs !== false,
      products: components.products !== false,
    };

    const tw: any = tenantId ? { tenantId } : {};
    const results: any = {};

    // Delete in correct order to avoid foreign key constraints

    // 1. Delete audit logs (if selected)
    if (cleanupConfig.auditLogs) {
      const deletedAuditLogs = await this.prisma.auditLog.deleteMany({ where: { ...tw } });
      results.auditLogs = deletedAuditLogs.count;
    }

    // 2. Delete cart items (if carts selected - references products)
    if (cleanupConfig.carts) {
      const deletedCartItems = await this.prisma.cartItem.deleteMany({
        where: { cart: { ...tw } },
      });
      results.cartItems = deletedCartItems.count;

      // 3. Delete carts
      const deletedCarts = await this.prisma.cart.deleteMany({ where: { ...tw } });
      results.carts = deletedCarts.count;
    }

    // 4. Delete delivery slots (if selected)
    if (cleanupConfig.deliverySlots) {
      const deletedSlots = await this.prisma.deliverySlot.deleteMany({ where: { ...tw } });
      results.deliverySlots = deletedSlots.count;
    }

    // 5. Delete orders (if selected - cascade will handle order items)
    if (cleanupConfig.orders) {
      const deletedOrders = await this.prisma.order.deleteMany({ where: { ...tw } });
      results.orders = deletedOrders.count;
    }

    // 6. Delete addresses (if selected)
    if (cleanupConfig.addresses) {
      const deletedAddresses = await this.prisma.address.deleteMany({
        where: { user: { ...tw } },
      });
      results.addresses = deletedAddresses.count;
    }

    // 7. Delete customer profiles and users (if customers selected)
    if (cleanupConfig.customers) {
      await this.prisma.customerProfile.deleteMany({
        where: { user: { ...tw } },
      });

      // Delete all CUSTOMER users (preserve ADMIN and STAFF)
      const deletedCustomers = await this.prisma.user.deleteMany({
        where: { role: 'CUSTOMER', ...tw },
      });
      results.customers = deletedCustomers.count;
    }

    // 8. Delete product variants and products (if products selected)
    if (cleanupConfig.products) {
      // Delete cart items first (references products and variants)
      // Must delete even if carts cleanup is disabled
      if (!cleanupConfig.carts) {
        const deletedCartItems = await this.prisma.cartItem.deleteMany({
          where: { cart: { ...tw } },
        });
        results.cartItems = deletedCartItems.count;
      }

      // Delete order items (references products and variants)
      const deletedOrderItems = await this.prisma.orderItem.deleteMany({
        where: { order: { ...tw } },
      });
      results.orderItems = deletedOrderItems.count;

      // Delete product images (references products)
      const deletedImages = await this.prisma.productImage.deleteMany({
        where: { product: { ...tw } },
      });
      results.productImages = deletedImages.count;

      // Delete inventory (references products)
      const deletedInventory = await this.prisma.inventory.deleteMany({
        where: { product: { ...tw } },
      });
      results.inventory = deletedInventory.count;

      // Delete variants (references products)
      const deletedVariants = await this.prisma.productVariant.deleteMany({
        where: { product: { ...tw } },
      });
      results.productVariants = deletedVariants.count;

      // Finally delete products
      const deletedProducts = await this.prisma.product.deleteMany({ where: { ...tw } });
      results.products = deletedProducts.count;
    }

    const deletedItems = Object.keys(results);
    console.log('🧹 Database cleanup completed:', results);

    return {
      message: `Database cleaned successfully - ${deletedItems.length > 0 ? deletedItems.join(', ') + ' deleted' : 'No items deleted'}`,
      results,
      selectedComponents: cleanupConfig,
      preserved: 'Admin and staff accounts, categories, and settings were preserved',
    };
  }
}
