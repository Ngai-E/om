import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto, UpdateBrandingDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('platform/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // ============================================
  // SUPER ADMIN: Tenant Management
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tenantService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getStats() {
    return this.tenantService.getPlatformStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findById(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async delete(@Param('id') id: string) {
    return this.tenantService.delete(id);
  }

  // ============================================
  // BRANDING
  // ============================================

  @Get(':id/branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getBranding(@Param('id') id: string) {
    return this.tenantService.getBranding(id);
  }

  @Put(':id/branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateBranding(
    @Param('id') id: string,
    @Body() dto: UpdateBrandingDto,
  ) {
    return this.tenantService.updateBranding(id, dto);
  }

  // ============================================
  // DOMAINS
  // ============================================

  @Get(':id/domains')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getDomains(@Param('id') id: string) {
    return this.tenantService.getDomains(id);
  }

  @Post(':id/domains')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async addDomain(
    @Param('id') id: string,
    @Body() body: { domain: string; type?: 'SUBDOMAIN' | 'CUSTOM' },
  ) {
    return this.tenantService.addDomain(id, body.domain, body.type);
  }

  @Delete(':id/domains/:domainId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async removeDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
  ) {
    return this.tenantService.removeDomain(id, domainId);
  }
}

// ============================================
// PUBLIC: Storefront tenant resolution
// ============================================

@Controller('storefront')
export class StorefrontTenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('resolve')
  async resolveByDomain(@Query('domain') domain: string) {
    if (!domain) {
      return { error: 'Domain parameter required' };
    }
    const tenant = await this.tenantService.findByDomain(domain);
    if (!tenant) {
      return { error: 'Store not found' };
    }
    return tenant;
  }

  @Get('store/:slug')
  async getStoreBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }
}
