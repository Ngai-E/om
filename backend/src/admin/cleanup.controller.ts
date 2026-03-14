import { Controller, Post, Body, UseGuards, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('admin')
@Controller('admin/cleanup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class CleanupController {
  constructor(private prisma: PrismaService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview what will be deleted (Admin only)' })
  async previewCleanup(@Body() { code }: { code: string }) {
    const DEVELOPER_CODE = process.env.CLEANUP_SECRET_CODE;

    if (!DEVELOPER_CODE || code !== DEVELOPER_CODE) {
      throw new BadRequestException('Invalid cleanup code. Please check your secret code and try again.');
    }

    // Count all customers (non-admin users)
    const customers = await this.prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // Count all orders
    const orders = await this.prisma.order.count();

    // Count all carts
    const carts = await this.prisma.cart.count();

    // Count all cart items
    const cartItems = await this.prisma.cartItem.count();

    // Count all addresses
    const addresses = await this.prisma.address.count();

    // Count all delivery slots
    const deliverySlots = await this.prisma.deliverySlot.count();

    // Count all audit logs
    const auditLogs = await this.prisma.auditLog.count();

    return {
      willDelete: {
        customers,
        orders,
        carts,
        cartItems,
        addresses,
        deliverySlots,
        auditLogs,
      },
      warning: '⚠️ This will delete ALL customer data! Admin and staff accounts will be preserved.',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Clean database - DANGER ZONE (Admin only)' })
  async cleanupDatabase(@Body() { code }: { code: string }) {
    const DEVELOPER_CODE = process.env.CLEANUP_SECRET_CODE;

    if (!DEVELOPER_CODE || code !== DEVELOPER_CODE) {
      throw new BadRequestException('Invalid cleanup code. Please check your secret code and try again.');
    }

    const results = {
      customers: 0,
      orders: 0,
      carts: 0,
      cartItems: 0,
      addresses: 0,
      deliverySlots: 0,
      auditLogs: 0,
    };

    // Delete in correct order to avoid foreign key constraints

    // 1. Delete audit logs
    const deletedAuditLogs = await this.prisma.auditLog.deleteMany({});
    results.auditLogs = deletedAuditLogs.count;

    // 2. Delete cart items
    const deletedCartItems = await this.prisma.cartItem.deleteMany({});
    results.cartItems = deletedCartItems.count;

    // 3. Delete carts
    const deletedCarts = await this.prisma.cart.deleteMany({});
    results.carts = deletedCarts.count;

    // 4. Delete delivery slots
    const deletedSlots = await this.prisma.deliverySlot.deleteMany({});
    results.deliverySlots = deletedSlots.count;

    // 5. Delete orders (cascade will handle order items)
    const deletedOrders = await this.prisma.order.deleteMany({});
    results.orders = deletedOrders.count;

    // 6. Delete addresses
    const deletedAddresses = await this.prisma.address.deleteMany({});
    results.addresses = deletedAddresses.count;

    // 7. Delete customer profiles
    await this.prisma.customerProfile.deleteMany({});

    // 8. Delete all CUSTOMER users (preserve ADMIN and STAFF)
    const deletedCustomers = await this.prisma.user.deleteMany({
      where: { role: 'CUSTOMER' },
    });
    results.customers = deletedCustomers.count;

    console.log('🧹 Database cleanup completed:', results);

    return {
      message: 'Database cleaned successfully - ALL customer data deleted',
      results,
      preserved: 'Admin and staff accounts were preserved',
    };
  }
}
