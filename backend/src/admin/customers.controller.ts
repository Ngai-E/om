import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { Request } from 'express';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  async getAllCustomers(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('riskLevel') riskLevel?: any,
    @Query('isBlocked') isBlocked?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.getAllCustomers({
      search,
      riskLevel,
      isBlocked: isBlocked === 'true' ? true : isBlocked === 'false' ? false : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      tenantId: (req as any).tenantId,
    });
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    return this.customersService.getCustomerStats((req as any).tenantId);
  }

  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    return this.customersService.getCustomerById(id);
  }

  @Patch(':id/risk')
  async updateCustomerRisk(
    @Param('id') id: string,
    @Body() data: {
      riskLevel?: any;
      isBlocked?: boolean;
      blockedReason?: string;
      adminNotes?: string;
      tags?: string[];
    },
    @CurrentUser() user: any,
  ) {
    return this.customersService.updateCustomerRisk(id, data, user.id);
  }

  @Post(':id/metrics')
  async updateMetrics(@Param('id') id: string) {
    await this.customersService.updateCustomerMetrics(id);
    return { message: 'Metrics updated successfully' };
  }

  @Get(':id/risk-score')
  async getRiskScore(@Param('id') id: string) {
    return this.customersService.calculateRiskScore(id);
  }
}
