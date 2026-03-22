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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LicensingService } from './licensing.service';
import { CreatePackageDto, UpdatePackageDto, CreateLicenseDto, UpdateLicenseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('licensing')
@Controller('licensing')
export class LicensingController {
  constructor(private licensingService: LicensingService) {}

  // ============================================
  // PACKAGE MANAGEMENT (Admin Only)
  // ============================================

  @Post('packages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new package' })
  async createPackage(@Body() dto: CreatePackageDto) {
    return this.licensingService.createPackage(dto);
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get all packages' })
  async getAllPackages(@Query('includeInactive') includeInactive?: string) {
    return this.licensingService.getAllPackages(includeInactive === 'true');
  }

  @Get('packages/:id')
  @ApiOperation({ summary: 'Get package by ID' })
  async getPackage(@Param('id') id: string) {
    return this.licensingService.getPackage(id);
  }

  @Put('packages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a package' })
  async updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.licensingService.updatePackage(id, dto);
  }

  @Delete('packages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a package' })
  async deletePackage(@Param('id') id: string) {
    return this.licensingService.deletePackage(id);
  }

  // ============================================
  // LICENSE MANAGEMENT (Admin Only)
  // ============================================

  @Post('licenses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new license' })
  async createLicense(@Body() dto: CreateLicenseDto, @CurrentUser() user) {
    return this.licensingService.createLicense(dto, user.id);
  }

  @Get('licenses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all licenses' })
  async getAllLicenses(
    @Query('status') status?: string,
    @Query('packageId') packageId?: string,
  ) {
    return this.licensingService.getAllLicenses({ status, packageId });
  }

  @Get('licenses/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get license by ID' })
  async getLicense(@Param('id') id: string) {
    return this.licensingService.getLicense(id);
  }

  @Put('licenses/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a license' })
  async updateLicense(@Param('id') id: string, @Body() dto: UpdateLicenseDto) {
    return this.licensingService.updateLicense(id, dto);
  }

  @Post('licenses/:id/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a license' })
  async revokeLicense(@Param('id') id: string) {
    return this.licensingService.revokeLicense(id);
  }

  // ============================================
  // LICENSE VALIDATION (Public with Key)
  // ============================================

  @Post('validate')
  @ApiOperation({ summary: 'Validate a license key' })
  async validateLicense(
    @Body() body: { licenseKey: string; domain?: string },
  ) {
    return this.licensingService.validateLicense(body.licenseKey, body.domain);
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate a license' })
  async activateLicense(@Body() body: { licenseKey: string }) {
    return this.licensingService.activateLicense(body.licenseKey);
  }

  @Get('features/:licenseKey')
  @ApiOperation({ summary: 'Get features for a license' })
  async getFeatures(@Param('licenseKey') licenseKey: string) {
    return this.licensingService.getFeatures(licenseKey);
  }

  @Get('usage/:licenseKey')
  @ApiOperation({ summary: 'Check usage limits for a license' })
  async checkUsageLimits(@Param('licenseKey') licenseKey: string) {
    return this.licensingService.checkUsageLimits(licenseKey);
  }

  // ============================================
  // STATISTICS (Admin Only)
  // ============================================

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get licensing statistics' })
  async getStatistics() {
    return this.licensingService.getStatistics();
  }
}
