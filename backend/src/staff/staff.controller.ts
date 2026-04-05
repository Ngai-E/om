import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreatePhoneOrderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantRequiredGuard } from '../common/guards/tenant-required.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantContext } from '../common/interfaces/tenant-context.interface';

@ApiTags('staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard, TenantRequiredGuard)
@Roles('STAFF', 'ADMIN')
@ApiBearerAuth()
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Post('orders/phone')
  @ApiOperation({ summary: 'Create phone order (Staff/Admin only)' })
  @ApiResponse({ status: 201, description: 'Phone order created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createPhoneOrder(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: any, @Body() dto: CreatePhoneOrderDto) {
    return this.staffService.createPhoneOrder(user.id, dto, tenant.id);
  }

  @Get('customers/search')
  @ApiOperation({ summary: 'Search customers (Staff/Admin only)' })
  @ApiQuery({ name: 'q', description: 'Search query (email, phone, name)' })
  @ApiResponse({ status: 200, description: 'Customers found' })
  async searchCustomers(@CurrentTenant() tenant: TenantContext, @Query('q') query: string) {
    return this.staffService.searchCustomers(query, tenant.id);
  }

  @Get('customers/:customerId/addresses')
  @ApiOperation({ summary: 'Get customer addresses (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Customer addresses retrieved' })
  async getCustomerAddresses(@Param('customerId') customerId: string) {
    return this.staffService.getCustomerAddresses(customerId);
  }

  @Get('dashboard/tasks')
  @ApiOperation({ summary: 'Get staff dashboard task counts (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Task counts retrieved' })
  async getDashboardTasks(@CurrentTenant() tenant: TenantContext) {
    return this.staffService.getDashboardTasks(tenant.id);
  }

  @Get('orders/recent')
  @ApiOperation({ summary: 'Get recent orders (Staff/Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent orders retrieved' })
  async getRecentOrders(
    @CurrentTenant() tenant: TenantContext,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.staffService.getRecentOrders(limit, tenant.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders for staff (Staff/Admin only)' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async getOrders(@CurrentTenant() tenant: TenantContext, @Query('status') status?: string) {
    return this.staffService.getStaffOrders(status, tenant.id);
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get order details for staff (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Order details retrieved' })
  async getOrderDetails(@Param('orderId') orderId: string) {
    return this.staffService.getOrderDetails(orderId);
  }

  @Patch('orders/:orderId/status')
  @ApiOperation({ summary: 'Update order status (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    return this.staffService.updateOrderStatus(orderId, body.status);
  }
}
