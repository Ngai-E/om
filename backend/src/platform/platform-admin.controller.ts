import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlatformAdminService } from './platform-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Platform Admin Controller
 * 
 * Routes: /platform/admin/*
 * Access: SUPER_ADMIN only
 * 
 * Responsibilities:
 * - Manage tenants (suspend, activate, delete)
 * - Manage subscriptions (change plan, extend trial)
 * - View platform-wide statistics
 * - Audit log access
 */
@ApiTags('platform-admin')
@Controller('platform/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class PlatformAdminController {
  constructor(private platformAdminService: PlatformAdminService) {}

  // ============================================
  // TENANT MANAGEMENT
  // ============================================

  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants (Super Admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Tenants retrieved' })
  async listTenants(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.platformAdminService.listTenants({ status, search, page, limit }, user.id);
  }

  @Get('tenants/:tenantId')
  @ApiOperation({ summary: 'Get tenant details (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Tenant details retrieved' })
  async getTenant(@CurrentUser() user: any, @Param('tenantId') tenantId: string) {
    return this.platformAdminService.getTenantDetails(tenantId, user.id);
  }

  @Patch('tenants/:tenantId/suspend')
  @ApiOperation({ summary: 'Suspend a tenant (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Tenant suspended' })
  async suspendTenant(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Body() body: { reason: string },
  ) {
    return this.platformAdminService.suspendTenant(tenantId, body.reason, user.id);
  }

  @Patch('tenants/:tenantId/activate')
  @ApiOperation({ summary: 'Activate a suspended tenant (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Tenant activated' })
  async activateTenant(@CurrentUser() user: any, @Param('tenantId') tenantId: string) {
    return this.platformAdminService.activateTenant(tenantId, user.id);
  }

  @Patch('tenants/:tenantId/disable')
  @ApiOperation({ summary: 'Permanently disable a tenant (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Tenant disabled' })
  async disableTenant(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Body() body: { reason: string },
  ) {
    return this.platformAdminService.disableTenant(tenantId, body.reason, user.id);
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  @Patch('tenants/:tenantId/subscription/plan')
  @ApiOperation({ summary: 'Change tenant plan (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Plan changed' })
  async changePlan(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Body() body: { planCode: string; reason: string },
  ) {
    return this.platformAdminService.changePlan(tenantId, body.planCode, body.reason, user.id);
  }

  @Patch('tenants/:tenantId/subscription/extend-trial')
  @ApiOperation({ summary: 'Extend trial period (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Trial extended' })
  async extendTrial(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Body() body: { days: number; reason: string },
  ) {
    return this.platformAdminService.extendTrial(tenantId, body.days, body.reason, user.id);
  }

  // ============================================
  // PLATFORM STATISTICS
  // ============================================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get platform overview statistics (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getOverviewStats(@CurrentUser() user: any) {
    return this.platformAdminService.getOverviewStats(user.id);
  }

  @Get('stats/revenue')
  @ApiOperation({ summary: 'Get revenue statistics (Super Admin)' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'] })
  @ApiResponse({ status: 200, description: 'Revenue stats retrieved' })
  async getRevenueStats(
    @CurrentUser() user: any,
    @Query('period') period: string = 'month',
  ) {
    return this.platformAdminService.getRevenueStats(period, user.id);
  }

  // ============================================
  // AUDIT LOG
  // ============================================

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get platform audit logs (Super Admin)' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'targetType', required: false })
  @ApiQuery({ name: 'targetId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.platformAdminService.getAuditLogs({
      action,
      targetType,
      targetId,
      page,
      limit,
    });
  }
}
