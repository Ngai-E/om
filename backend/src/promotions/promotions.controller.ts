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
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireFeature } from '../auth/decorators/feature-gate.decorator';
import { FeatureGateGuard } from '../auth/guards/feature-gate.guard';
import { Request } from 'express';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private promotionsService: PromotionsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get('active')
  @ApiOperation({ summary: 'Get all active promotions (public)' })
  @ApiResponse({ status: 200, description: 'Active promotions retrieved' })
  async getActivePromotions(@Req() req: Request) {
    return this.promotionsService.getActivePromotions((req as any).tenantId);
  }

  @Get('eligible')
  @UseGuards(JwtAuthGuard)
  async getEligiblePromotions(@CurrentUser() user) {
    return this.promotionsService.getEligiblePromotionsForUser(user.id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get promotion by code (public)' })
  @ApiParam({ name: 'code', description: 'Promo code' })
  @ApiResponse({ status: 200, description: 'Promotion found' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  async getByCode(@Req() req: Request, @Param('code') code: string) {
    return this.promotionsService.findByCode(code, (req as any).tenantId);
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Get promotion details (public)' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Promotion found' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  async getPublicPromotion(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGateGuard)
  @Roles('ADMIN')
  @RequireFeature('promotions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create promotion (Admin only)' })
  @ApiResponse({ status: 201, description: 'Promotion created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(@Req() req: Request, @Body() dto: CreatePromotionDto, @CurrentUser() user: any) {
    return this.promotionsService.create(dto, user.id, (req as any).tenantId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all promotions (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Promotions retrieved' })
  async findAll(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.promotionsService.findAll({ tenantId: (req as any).tenantId, status, search, page, limit });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get promotion details (Admin only)' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Promotion found' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  async findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update promotion (Admin only)' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Promotion updated' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser() user: any,
  ) {
    return this.promotionsService.update(id, dto, user.id, (req as any).tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete promotion (Admin only)' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Promotion deleted' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.promotionsService.delete(id, user.id);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate promotion (Admin only)' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Promotion activated' })
  async activate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.promotionsService.activate(id, user.id);
  }

  @Patch(':id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause promotion (Admin only)' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Promotion paused' })
  async pause(@Param('id') id: string, @CurrentUser() user: any) {
    return this.promotionsService.pause(id, user.id);
  }

  @Patch(':id/end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End promotion (Admin only)' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Promotion ended' })
  async end(@Param('id') id: string, @CurrentUser() user: any) {
    return this.promotionsService.end(id, user.id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get promotion statistics (Admin only)' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getStats(@Param('id') id: string) {
    return this.promotionsService.getPromotionStats(id);
  }

  @Get(':id/redemptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getRedemptions(@Param('id') id: string) {
    return this.promotionsService.getRedemptions(id);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async importPromotions(@Body() body: { promotions: CreatePromotionDto[]; skipExisting?: boolean }) {
    const { promotions, skipExisting = true } = body;
    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const promoData of promotions) {
      try {
        // Check if promo code already exists
        if (promoData.code) {
          try {
            await this.promotionsService.findByCode(promoData.code);
            // If we get here, the code exists
            if (skipExisting) {
              results.skipped++;
              continue;
            } else {
              results.failed++;
              results.errors.push(`Promo code "${promoData.code}" already exists`);
              continue;
            }
          } catch (err) {
            // Code doesn't exist, continue with creation
          }
        }

        await this.promotionsService.create(promoData, 'import');
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import "${promoData.name}": ${error.message}`);
      }
    }

    return {
      message: `Import completed: ${results.success} successful, ${results.skipped} skipped, ${results.failed} failed`,
      ...results,
    };
  }

  @Get('export/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async exportPromotions() {
    const promotions = await this.promotionsService.findAll({});
    
    // Remove IDs and timestamps for clean export
    const exportData = promotions.data.map(promo => {
      const { id, createdAt, updatedAt, stats, ...rest } = promo as any;
      return rest;
    });

    return {
      data: exportData,
      count: exportData.length,
      exportedAt: new Date().toISOString(),
    };
  }
}
