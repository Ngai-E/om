import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TestimonialsService, CreateTestimonialDto, UpdateTestimonialDto } from './testimonials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantRequiredGuard } from '../common/guards/tenant-required.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantContext } from '../common/interfaces/tenant-context.interface';

@ApiTags('testimonials')
@Controller('testimonials')
@UseGuards(TenantRequiredGuard)
export class TestimonialsController {
  constructor(private testimonialsService: TestimonialsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get('active')
  @ApiOperation({ summary: 'Get active testimonials for homepage (Public)' })
  @ApiResponse({ status: 200, description: 'Active testimonials retrieved' })
  async getActiveTestimonials(@CurrentTenant() tenant: TenantContext) {
    return this.testimonialsService.findActive(tenant.id);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create testimonial (Admin/Staff only)' })
  @ApiResponse({ status: 201, description: 'Testimonial created' })
  async create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateTestimonialDto) {
    return this.testimonialsService.create(dto, tenant.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all testimonials (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'All testimonials retrieved' })
  async findAll(@CurrentTenant() tenant: TenantContext) {
    return this.testimonialsService.findAll(tenant.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get testimonial by ID (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Testimonial retrieved' })
  @ApiResponse({ status: 404, description: 'Testimonial not found' })
  async findOne(@Param('id') id: string) {
    return this.testimonialsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update testimonial (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Testimonial updated' })
  @ApiResponse({ status: 404, description: 'Testimonial not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.testimonialsService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle testimonial active status (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Testimonial status toggled' })
  async toggleActive(@Param('id') id: string) {
    return this.testimonialsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete testimonial (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Testimonial deleted' })
  @ApiResponse({ status: 404, description: 'Testimonial not found' })
  async remove(@Param('id') id: string) {
    return this.testimonialsService.remove(id);
  }
}
