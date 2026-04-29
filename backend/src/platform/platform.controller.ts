import { Controller, Get, Put, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Decimal } from '@prisma/client/runtime/library';

@ApiTags('platform')
@Controller('platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
@ApiBearerAuth()
export class PlatformController {
  constructor(private platformService: PlatformService) {}

  // ============================================
  // PLATFORM CONFIGURATION
  // ============================================

  @Get('config')
  @ApiOperation({ summary: 'Get all platform configuration (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform config retrieved' })
  async getPlatformConfig() {
    const config = await this.platformService.getAllPlatformConfig();
    
    // Hide sensitive values
    const safeConfig: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      if (key.includes('secret') || key.includes('key') || key.includes('password')) {
        safeConfig[key] = value ? '***' : '';
      } else {
        safeConfig[key] = value;
      }
    }
    
    return { config: safeConfig };
  }

  @Put('config')
  @ApiOperation({ summary: 'Update platform configuration (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform config updated' })
  async updatePlatformConfig(
    @Body() body: { key: string; value: string; description?: string },
    @CurrentUser() user: any,
  ) {
    await this.platformService.setPlatformConfig(
      body.key,
      body.value,
      body.description,
      body.key.includes('secret') || body.key.includes('key'), // Encrypt sensitive fields
      user.id
    );
    return { message: 'Platform configuration updated successfully' };
  }

  @Get('config/:key')
  @ApiOperation({ summary: 'Get specific platform config value (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Config value retrieved' })
  async getPlatformConfigValue(@Param('key') key: string) {
    const value = await this.platformService.getPlatformConfig(key);
    return { 
      key, 
      value: key.includes('secret') || key.includes('key') ? (value ? '***' : '') : value 
    };
  }

  // ============================================
  // PLATFORM SETTINGS (flat key/value map for frontend)
  // ============================================

  // Keys that tenants cannot override
  private readonly PLATFORM_ONLY_KEYS = [
    'platform_name',
    'platform_domain',
    'platform_subdomain_suffix',
    'platform_maintenance_mode',
    'default_trial_days',
    'default_plan_id',
    'signup_enabled',
    'global_rate_limit',
    'marketplace_enabled',
    'marketplace_commission_percent',
  ];

  @Get('settings')
  @ApiOperation({ summary: 'Get all platform settings as flat map (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform settings retrieved' })
  async getPlatformSettings() {
    const config = await this.platformService.getAllPlatformConfig();

    // Redact sensitive values
    const settings: Record<string, any> = {};
    for (const [key, value] of Object.entries(config)) {
      if (key.includes('secret') || (key.includes('key') && key !== 'stripe_publishable_key')) {
        settings[key] = value ? '***' : '';
      } else {
        // Try to parse booleans and numbers
        if (value === 'true') settings[key] = true;
        else if (value === 'false') settings[key] = false;
        else if (value !== '' && !isNaN(Number(value))) settings[key] = Number(value);
        else settings[key] = value;
      }
    }

    // Ensure all known platform-only keys exist (even if not yet set)
    for (const key of this.PLATFORM_ONLY_KEYS) {
      if (!(key in settings)) settings[key] = null;
    }

    return { settings, platformOnlyKeys: this.PLATFORM_ONLY_KEYS };
  }

  @Put('settings')
  @ApiOperation({ summary: 'Batch-update platform settings (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform settings updated' })
  async updatePlatformSettings(
    @Body() body: Record<string, any>,
    @CurrentUser() user: any,
  ) {
    for (const [key, value] of Object.entries(body)) {
      const isSensitive = key.includes('secret') || (key.includes('key') && key !== 'stripe_publishable_key');
      const strValue = value === null || value === undefined ? '' : String(value);
      await this.platformService.setPlatformConfig(key, strValue, undefined, isSensitive, user.id);
    }
    return { message: 'Platform settings updated successfully' };
  }

  // ============================================
  // PLATFORM FEES & TAXES
  // ============================================

  @Get('fees')
  @ApiOperation({ summary: 'Get platform fee configuration (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform fees retrieved' })
  async getPlatformFees() {
    const fees = await this.platformService.getPlatformFees();
    return { fees };
  }

  @Put('fees')
  @ApiOperation({ summary: 'Update platform fee configuration (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform fees updated' })
  async updatePlatformFees(
    @Body() body: {
      platformFeePercent?: number;
      taxPercent?: number;
      minimumPayout?: number;
      payoutSchedule?: string;
    },
    @CurrentUser() user: any,
  ) {
    const fees: any = {};
    if (body.platformFeePercent !== undefined) fees.platformFeePercent = new Decimal(body.platformFeePercent);
    if (body.taxPercent !== undefined) fees.taxPercent = new Decimal(body.taxPercent);
    if (body.minimumPayout !== undefined) fees.minimumPayout = new Decimal(body.minimumPayout);
    if (body.payoutSchedule !== undefined) fees.payoutSchedule = body.payoutSchedule;

    await this.platformService.updatePlatformFees(fees, user.id);
    return { message: 'Platform fees updated successfully', fees };
  }

  // ============================================
  // TENANT BALANCES
  // ============================================

  @Get('balances')
  @ApiOperation({ summary: 'Get all tenant balances (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant balances retrieved' })
  async getTenantBalances() {
    const balances = await this.platformService.getAllTenantBalances();
    return { balances };
  }

  @Get('balances/:tenantId')
  @ApiOperation({ summary: 'Get specific tenant balance (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant balance retrieved' })
  async getTenantBalance(@Param('tenantId') tenantId: string) {
    const balance = await this.platformService.getTenantBalance(tenantId);
    return { balance };
  }

  // ============================================
  // PAYOUTS
  // ============================================

  @Get('payouts/stats')
  @ApiOperation({ summary: 'Get payout statistics (Super Admin only) - MUST be before :payoutId routes' })
  @ApiResponse({ status: 200, description: 'Payout stats retrieved' })
  async getPayoutStats() {
    const stats = await this.platformService.getPayoutStats();
    return stats;
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get all payouts (Super Admin only)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Payouts retrieved' })
  async getPayouts(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.platformService.getPayouts(tenantId, status, page, limit);
    return result;
  }

  @Post('payouts')
  @ApiOperation({ summary: 'Create a new payout (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Payout created' })
  async createPayout(
    @Body() body: {
      tenantId: string;
      amount: number;
      paymentMethod: string;
      bankAccountName?: string;
      bankAccountNumber?: string;
      bankSortCode?: string;
      reference?: string;
      notes?: string;
    },
    @CurrentUser() user: any,
  ) {
    const fees = await this.platformService.getPlatformFees();
    const grossAmount = new Decimal(body.amount);
    const platformFee = grossAmount.mul(fees.platformFeePercent).div(100);
    const taxAmount = grossAmount.mul(fees.taxPercent).div(100);
    const netAmount = grossAmount.sub(platformFee).sub(taxAmount);

    const payout = await this.platformService.createPayout({
      tenantId: body.tenantId,
      amount: netAmount,
      grossAmount,
      platformFee,
      taxAmount,
      paymentMethod: body.paymentMethod,
      bankAccountName: body.bankAccountName,
      bankAccountNumber: body.bankAccountNumber,
      bankSortCode: body.bankSortCode,
      reference: body.reference,
      notes: body.notes,
      processedBy: user.id,
    });

    return { message: 'Payout created successfully', payout };
  }

  @Put('payouts/:payoutId/status')
  @ApiOperation({ summary: 'Update payout status (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Payout status updated' })
  async updatePayoutStatus(
    @Param('payoutId') payoutId: string,
    @Body() body: { status: string; stripePayoutId?: string },
    @CurrentUser() user: any,
  ) {
    const payout = await this.platformService.updatePayoutStatus(
      payoutId,
      body.status,
      user.id,
      body.stripePayoutId
    );
    return { message: 'Payout status updated successfully', payout };
  }



  // ============================================
  // IMAGE UPLOAD CONFIGURATION
  // ============================================

  @Get('image-upload')
  @ApiOperation({ summary: 'Get image upload configuration (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Image upload config retrieved' })
  async getImageUploadConfig() {
    const config = await this.platformService.getAllPlatformConfig();
    const imageConfig = {
      service: config.image_upload_service || 'imgbb',
      imgbbApiKey: config.imgbb_api_key || '',
      cloudinaryConfig: config.cloudinary_config ? JSON.parse(config.cloudinary_config) : null,
    };
    return { config: imageConfig };
  }

  @Put('image-upload')
  @ApiOperation({ summary: 'Update image upload configuration (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Image upload config updated' })
  async updateImageUploadConfig(
    @Body() body: {
      service: 'imgbb' | 'cloudinary';
      imgbbApiKey?: string;
      cloudinaryConfig?: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
      };
    },
    @CurrentUser() user: any,
  ) {
    await this.platformService.setPlatformConfig(
      'image_upload_service',
      body.service,
      'Platform image upload service',
      false,
      user.id
    );

    if (body.imgbbApiKey) {
      await this.platformService.setPlatformConfig(
        'imgbb_api_key',
        body.imgbbApiKey,
        'ImgBB API key for image uploads',
        true, // Encrypt API key
        user.id
      );
    }

    if (body.cloudinaryConfig) {
      await this.platformService.setPlatformConfig(
        'cloudinary_config',
        JSON.stringify(body.cloudinaryConfig),
        'Cloudinary configuration for image uploads',
        true, // Encrypt config
        user.id
      );
    }

    return { message: 'Image upload configuration updated successfully' };
  }

  // ============================================
  // STRIPE CONFIGURATION
  // ============================================

  @Get('stripe')
  @ApiOperation({ summary: 'Get Stripe configuration (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Stripe config retrieved' })
  async getStripeConfig() {
    const config = await this.platformService.getAllPlatformConfig();
    return {
      publishableKey: config.stripe_publishable_key || '',
      secretKey: config.stripe_secret_key ? '***' : '',
      webhookSecret: config.stripe_webhook_secret ? '***' : '',
      connectAccountId: config.stripe_connect_account_id || '',
    };
  }

  @Put('stripe')
  @ApiOperation({ summary: 'Update Stripe configuration (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Stripe config updated' })
  async updateStripeConfig(
    @Body() body: {
      publishableKey?: string;
      secretKey?: string;
      webhookSecret?: string;
      connectAccountId?: string;
    },
    @CurrentUser() user: any,
  ) {
    if (body.publishableKey) {
      await this.platformService.setPlatformConfig(
        'stripe_publishable_key',
        body.publishableKey,
        'Stripe publishable key',
        true,
        user.id
      );
    }

    if (body.secretKey) {
      await this.platformService.setPlatformConfig(
        'stripe_secret_key',
        body.secretKey,
        'Stripe secret key',
        true,
        user.id
      );
    }

    if (body.webhookSecret) {
      await this.platformService.setPlatformConfig(
        'stripe_webhook_secret',
        body.webhookSecret,
        'Stripe webhook secret',
        true,
        user.id
      );
    }

    if (body.connectAccountId) {
      await this.platformService.setPlatformConfig(
        'stripe_connect_account_id',
        body.connectAccountId,
        'Stripe Connect account ID',
        false,
        user.id
      );
    }

    return { message: 'Stripe configuration updated successfully' };
  }
}
