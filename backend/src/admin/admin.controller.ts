import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateProductDto, UpdateProductDto, UpdateInventoryDto, CreateStaffDto, UpdateStaffDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ============================================
  // DASHBOARD & STATS
  // ============================================

  @Get('badge-counts')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get badge counts for admin navigation' })
  @ApiResponse({ status: 200, description: 'Badge counts retrieved' })
  async getBadgeCounts() {
    return this.adminService.getBadgeCounts();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs with filters (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async getAuditLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('search') search?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getAuditLogs(page, limit, search, entity, action, userId);
  }

  // ============================================
  // PRODUCT MANAGEMENT
  // ============================================

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID (Admin only - includes inactive)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('id') productId: string) {
    return this.adminService.getProduct(productId);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create new product (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product created' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(@Param('id') productId: string, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(productId, dto);
  }

  @Patch('products/:id/status')
  @ApiOperation({ summary: 'Toggle product active status' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product status updated' })
  async toggleProductStatus(
    @Param('id') productId: string,
    @Body() dto: { isActive: boolean },
  ) {
    return this.adminService.toggleProductStatus(productId, dto.isActive);
  }

  @Post('products/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 201, description: 'Product duplicated' })
  async duplicateProduct(
    @Param('id') productId: string,
    @Body() dto: { nameSuffix?: string },
  ) {
    return this.adminService.duplicateProduct(productId, dto.nameSuffix || ' (Copy)');
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id') productId: string) {
    return this.adminService.deleteProduct(productId);
  }

  @Patch('products/:id/inventory')
  @ApiOperation({ summary: 'Update product inventory (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Inventory updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateInventory(@Param('id') productId: string, @Body() dto: UpdateInventoryDto) {
    return this.adminService.updateInventory(productId, dto);
  }

  @Post('products/import-csv')
  @ApiOperation({ summary: 'Import products from CSV file (Admin only)' })
  @ApiResponse({ status: 201, description: 'Products imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CSV format' })
  @UseInterceptors(FileInterceptor('file'))
  async importProductsFromCSV(@UploadedFile() file: Express.Multer.File) {
    return this.adminService.importProductsFromCSV(file);
  }

  @Get('products/export-csv')
  @ApiOperation({ summary: 'Export all products to CSV file (Admin only)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive products' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async exportProductsToCSV(
    @Query('includeInactive') includeInactive: boolean,
    @Res() res: Response,
  ) {
    const csv = await this.adminService.exportProductsToCSV(includeInactive);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }

  // ============================================
  // PRODUCT VARIANTS
  // ============================================

  @Post('products/:id/variants')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Create product variant' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 201, description: 'Variant created' })
  async createVariant(
    @Param('id') productId: string,
    @Body() variantData: {
      name: string;
      sku?: string;
      price: number;
      compareAtPrice?: number;
      stock: number;
      isActive: boolean;
    },
  ) {
    return this.adminService.createVariant(productId, variantData);
  }

  @Put('products/:id/variants/:variantId')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Update product variant' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiParam({ name: 'variantId', description: 'Variant ID' })
  @ApiResponse({ status: 200, description: 'Variant updated' })
  async updateVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() variantData: {
      name?: string;
      sku?: string;
      price?: number;
      compareAtPrice?: number;
      stock?: number;
      isActive?: boolean;
    },
  ) {
    return this.adminService.updateVariant(productId, variantId, variantData);
  }

  @Delete('products/:id/variants/:variantId')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Delete product variant' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiParam({ name: 'variantId', description: 'Variant ID' })
  @ApiResponse({ status: 200, description: 'Variant deleted' })
  async deleteVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.adminService.deleteVariant(productId, variantId);
  }

  // ============================================
  // ORDER MANAGEMENT
  // ============================================

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'isPhoneOrder', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async getAllOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('status') status?: string,
    @Query('isPhoneOrder') isPhoneOrder?: string,
  ) {
    const phoneOrderFilter = isPhoneOrder === 'true' ? true : isPhoneOrder === 'false' ? false : undefined;
    return this.adminService.getAllOrders(page, limit, status, phoneOrderFilter);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderDetails(@Param('id') orderId: string) {
    return this.adminService.getOrderDetails(orderId);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: { status: string },
  ) {
    return this.adminService.updateOrderStatus(orderId, dto.status);
  }

  @Patch('orders/:id/payment')
  @ApiOperation({ summary: 'Mark COD order as paid' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  async markOrderPaid(
    @Param('id') orderId: string,
    @Body() dto: { status: string },
  ) {
    return this.adminService.markOrderPaid(orderId, dto.status);
  }

  @Post('orders/:id/refund')
  @ApiOperation({ summary: 'Process partial refund' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 201, description: 'Refund processed' })
  async processRefund(
    @Param('id') orderId: string,
    @Body() dto: { amount: number; reason: string },
  ) {
    return this.adminService.processRefund(orderId, dto.amount, dto.reason);
  }

  @Patch('orders/:id/driver')
  @ApiOperation({ summary: 'Assign driver to order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Driver assigned' })
  async assignDriver(
    @Param('id') orderId: string,
    @Body() dto: { driverId: string },
  ) {
    return this.adminService.assignDriver(orderId, dto.driverId);
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getAllUsers(page, limit);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  // ============================================
  // DASHBOARD
  // ============================================

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============================================
  // DELIVERY MANAGEMENT
  // ============================================

  // Delivery Zones
  @Get('delivery-zones')
  @ApiOperation({ summary: 'Get all delivery zones (Admin only)' })
  @ApiResponse({ status: 200, description: 'Zones retrieved' })
  async getDeliveryZones() {
    return this.adminService.getAllDeliveryZones();
  }

  @Post('delivery-zones')
  @ApiOperation({ summary: 'Create delivery zone (Admin only)' })
  @ApiResponse({ status: 201, description: 'Zone created' })
  async createDeliveryZone(@Body() dto: any) {
    return this.adminService.createDeliveryZone(dto);
  }

  @Patch('delivery-zones/:id')
  @ApiOperation({ summary: 'Update delivery zone (Admin only)' })
  @ApiParam({ name: 'id', description: 'Zone ID' })
  @ApiResponse({ status: 200, description: 'Zone updated' })
  async updateDeliveryZone(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateDeliveryZone(id, dto);
  }

  @Delete('delivery-zones/:id')
  @ApiOperation({ summary: 'Delete delivery zone (Admin only)' })
  @ApiParam({ name: 'id', description: 'Zone ID' })
  @ApiResponse({ status: 200, description: 'Zone deleted' })
  async deleteDeliveryZone(@Param('id') id: string) {
    return this.adminService.deleteDeliveryZone(id);
  }

  // Delivery Slots
  @Get('delivery-slots')
  @ApiOperation({ summary: 'Get delivery slots (Admin only)' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Slots retrieved' })
  async getDeliverySlots(@Query('date') date?: string) {
    return this.adminService.getAllDeliverySlots(date);
  }

  @Post('delivery-slots')
  @ApiOperation({ summary: 'Create delivery slot (Admin only)' })
  @ApiResponse({ status: 201, description: 'Slot created' })
  async createDeliverySlot(@Body() dto: any) {
    return this.adminService.createDeliverySlot(dto);
  }

  @Patch('delivery-slots/:id')
  @ApiOperation({ summary: 'Update delivery slot (Admin only)' })
  @ApiParam({ name: 'id', description: 'Slot ID' })
  @ApiResponse({ status: 200, description: 'Slot updated' })
  async updateDeliverySlot(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateDeliverySlot(id, dto);
  }

  @Delete('delivery-slots/:id')
  @ApiOperation({ summary: 'Delete delivery slot (Admin only)' })
  @ApiParam({ name: 'id', description: 'Slot ID' })
  @ApiResponse({ status: 200, description: 'Slot deleted' })
  async deleteDeliverySlot(@Param('id') id: string) {
    return this.adminService.deleteDeliverySlot(id);
  }

  // ============================================
  // STAFF MANAGEMENT
  // ============================================

  @Post('staff')
  @ApiOperation({ summary: 'Create new staff member (Admin only)' })
  @ApiResponse({ status: 201, description: 'Staff created' })
  @ApiResponse({ status: 400, description: 'Email already in use' })
  async createStaff(@Body() dto: CreateStaffDto, @CurrentUser() user: any) {
    return this.adminService.createStaff(dto, user.id);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Get all staff members (Admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Staff list retrieved' })
  async getAllStaff(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllStaff(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('staff/:id')
  @ApiOperation({ summary: 'Get staff member by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff retrieved' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async getStaffById(@Param('id') id: string) {
    return this.adminService.getStaffById(id);
  }

  @Put('staff/:id')
  @ApiOperation({ summary: 'Update staff member (Admin only)' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff updated' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async updateStaff(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateStaff(id, dto, user.id);
  }

  @Delete('staff/:id')
  @ApiOperation({ summary: 'Delete staff member (Admin only)' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Staff deleted' })
  async deleteStaff(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deleteStaff(id, user.id);
  }

  @Post('staff/:id/reset-password')
  @ApiOperation({ summary: 'Reset staff password (Admin only)' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  async resetStaffPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.resetStaffPassword(id, newPassword, user.id);
  }
}
