import { Controller, Get, Query, UseGuards, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { Request } from 'express';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Req() req: Request,
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getAuditLogs({
      userId,
      entity,
      entityId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      tenantId: (req as any).tenantId,
    });
  }

  @Get('entity/:entity/:entityId')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get entity history (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Entity history retrieved successfully' })
  async getEntityHistory(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(entity, entityId);
  }

  @Get('user/:userId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user activity (Admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'User activity retrieved successfully' })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getUserActivity(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }
}
