import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService, PaymentMethod, PaymentMethodsConfig, PaymentType, ImageUploadService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantRequiredGuard } from '../common/guards/tenant-required.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantContext } from '../common/interfaces/tenant-context.interface';

@ApiTags('settings')
@Controller('settings')
@UseGuards(TenantRequiredGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings (public)' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getSettings(@CurrentTenant() tenant: TenantContext) {
    const tenantId = tenant.id;
    const settings = await this.settingsService.getAllSettings(tenantId);
    const paymentMethodsConfig = await this.settingsService.getPaymentMethodsConfig(tenantId);
    const enabledPaymentTypes = await this.settingsService.getEnabledPaymentTypes(tenantId);
    const guestCheckoutEnabled = await this.settingsService.getGuestCheckoutEnabled(tenantId);
    const emailNotificationsEnabled = await this.settingsService.getEmailNotificationsEnabled(tenantId);
    const allowImageUpload = await this.settingsService.getAllowImageUpload(tenantId);
    const allowImageLink = await this.settingsService.getAllowImageLink(tenantId);
    const imageUploadService = await this.settingsService.getImageUploadService(tenantId);
    const imgbbApiKey = await this.settingsService.getImgbbApiKey(tenantId);
    const cloudinaryConfig = await this.settingsService.getCloudinaryConfig(tenantId);
    const productOrdersInflation = await this.settingsService.getProductOrdersInflation(tenantId);
    const promotionUsageInflation = await this.settingsService.getPromotionUsageInflation(tenantId);
    const showProductOrderBadges = await this.settingsService.getShowProductOrderBadges(tenantId);
    const showPromotionUsageBadges = await this.settingsService.getShowPromotionUsageBadges(tenantId);
    
    // Return only public settings (hide sensitive API keys/secrets)
    return {
      payment_method: settings.payment_method || PaymentMethod.STRIPE_CHECKOUT,
      payment_methods_config: paymentMethodsConfig,
      enabled_payment_types: enabledPaymentTypes,
      store_name: settings.store_name || settings.storeName || 'OMEGA AFRO SHOP',
      store_email: settings.store_email || settings.storeEmail,
      phone_number: settings.phone_number || settings.phoneNumber,
      whatsapp_number: settings.whatsapp_number || settings.whatsappNumber,
      store_address: settings.store_address || settings.address,
      delivery_banner_message: settings.delivery_banner_message || settings.deliveryMessage,
      promotional_banner: settings.promotional_banner || settings.promoBanner,
      about_us: settings.about_us || settings.aboutUs,
      contact_email: settings.contact_email || settings.contactEmail,
      opening_hours: settings.opening_hours || settings.openingHours,
      google_maps_embed_url: settings.google_maps_embed_url || settings.googleMapsEmbedUrl,
      currency: settings.currency || 'GBP',
      guest_checkout_enabled: guestCheckoutEnabled,
      email_notifications_enabled: emailNotificationsEnabled,
      allow_image_upload: allowImageUpload,
      allow_image_link: allowImageLink,
      image_upload_service: imageUploadService,
      imgbb_api_key: imgbbApiKey ? '***' : null, // Hide actual key
      cloudinary_configured: !!cloudinaryConfig, // Just show if configured
      product_orders_inflation: productOrdersInflation,
      promotion_usage_inflation: promotionUsageInflation,
      show_product_order_badges: showProductOrderBadges,
      show_promotion_usage_badges: showPromotionUsageBadges,
    };
  }

  @Get('guest-checkout')
  @ApiOperation({ summary: 'Get guest checkout enabled status (public)' })
  @ApiResponse({ status: 200, description: 'Guest checkout status retrieved' })
  async getGuestCheckoutStatus(@CurrentTenant() tenant: TenantContext) {
    const enabled = await this.settingsService.getGuestCheckoutEnabled(tenant.id);
    return { enabled };
  }

  @Get('payment-method')
  @ApiOperation({ summary: 'Get current payment method' })
  @ApiResponse({ status: 200, description: 'Payment method retrieved' })
  async getPaymentMethod(@CurrentTenant() tenant: TenantContext) {
    const method = await this.settingsService.getPaymentMethod(tenant.id);
    return { payment_method: method };
  }

  @Put('payment-method')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment method (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment method updated' })
  async updatePaymentMethod(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { payment_method: PaymentMethod },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setPaymentMethod(body.payment_method, user.id, tenant.id);
    return { message: 'Payment method updated successfully', payment_method: body.payment_method };
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get payment methods configuration' })
  @ApiResponse({ status: 200, description: 'Payment methods config retrieved' })
  async getPaymentMethodsConfig(@CurrentTenant() tenant: TenantContext) {
    const tenantId = tenant.id;
    const config = await this.settingsService.getPaymentMethodsConfig(tenantId);
    const enabledTypes = await this.settingsService.getEnabledPaymentTypes(tenantId);
    return {
      config,
      enabled_payment_types: enabledTypes,
    };
  }

  @Put('payment-methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment methods configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment methods config updated' })
  async updatePaymentMethodsConfig(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { config: PaymentMethodsConfig },
    @CurrentUser() user: any,
  ) {
    const tenantId = tenant.id;
    await this.settingsService.setPaymentMethodsConfig(body.config, user.id, tenantId);
    const enabledTypes = await this.settingsService.getEnabledPaymentTypes(tenantId);
    return {
      message: 'Payment methods configuration updated successfully',
      config: body.config,
      enabled_payment_types: enabledTypes,
    };
  }

  @Put('guest-checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle guest checkout (Admin only)' })
  @ApiResponse({ status: 200, description: 'Guest checkout setting updated' })
  async updateGuestCheckout(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setGuestCheckoutEnabled(body.enabled, user.id, tenant.id);
    return {
      message: `Guest checkout ${body.enabled ? 'enabled' : 'disabled'} successfully`,
      guest_checkout_enabled: body.enabled,
    };
  }

  @Put('email-notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle email notifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Email notifications setting updated' })
  async updateEmailNotifications(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setEmailNotificationsEnabled(body.enabled, user.id, tenant.id);
    return {
      message: `Email notifications ${body.enabled ? 'enabled' : 'disabled'} successfully`,
      email_notifications_enabled: body.enabled,
    };
  }

  @Put('image-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle image upload (Admin only)' })
  @ApiResponse({ status: 200, description: 'Image upload setting updated' })
  async updateImageUpload(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setAllowImageUpload(body.enabled, user.id, tenant.id);
    return {
      message: `Image upload ${body.enabled ? 'enabled' : 'disabled'} successfully`,
      allow_image_upload: body.enabled,
    };
  }

  @Put('image-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle image link insertion (Admin only)' })
  @ApiResponse({ status: 200, description: 'Image link setting updated' })
  async updateImageLink(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setAllowImageLink(body.enabled, user.id, tenant.id);
    return {
      message: `Image link ${body.enabled ? 'enabled' : 'disabled'} successfully`,
      allow_image_link: body.enabled,
    };
  }

  @Put('image-upload-service')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set image upload service (Admin only)' })
  @ApiResponse({ status: 200, description: 'Image upload service updated' })
  async updateImageUploadService(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { service: ImageUploadService },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setImageUploadService(body.service, user.id, tenant.id);
    return {
      message: `Image upload service set to ${body.service}`,
      image_upload_service: body.service,
    };
  }

  @Put('imgbb-api-key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set ImgBB API key (Admin only)' })
  @ApiResponse({ status: 200, description: 'ImgBB API key updated' })
  async updateImgbbApiKey(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { apiKey: string },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setImgbbApiKey(body.apiKey, user.id, tenant.id);
    return {
      message: 'ImgBB API key updated successfully',
    };
  }

  @Put('cloudinary-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set Cloudinary configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cloudinary config updated' })
  async updateCloudinaryConfig(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { cloudName: string; apiKey: string; apiSecret: string },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setCloudinaryConfig(body, user.id, tenant.id);
    return {
      message: 'Cloudinary configuration updated successfully',
    };
  }

  @Get('upload-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get image upload configuration with actual keys (Admin only)' })
  @ApiResponse({ status: 200, description: 'Upload config retrieved' })
  async getUploadConfig(@CurrentTenant() tenant: TenantContext) {
    const tenantId = tenant.id;
    const service = await this.settingsService.getImageUploadService(tenantId);
    const imgbbApiKey = await this.settingsService.getImgbbApiKey(tenantId);
    const cloudinaryConfig = await this.settingsService.getCloudinaryConfig(tenantId);
    
    return {
      service,
      imgbbApiKey,
      cloudinaryConfig,
    };
  }

  @Put('social-proof/product-inflation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product orders inflation multiplier (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product orders inflation updated' })
  async updateProductOrdersInflation(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { multiplier: number },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setProductOrdersInflation(body.multiplier, user.id, tenant.id);
    return {
      message: 'Product orders inflation multiplier updated successfully',
      product_orders_inflation: body.multiplier,
    };
  }

  @Put('social-proof/promotion-inflation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update promotion usage inflation multiplier (Admin only)' })
  @ApiResponse({ status: 200, description: 'Promotion usage inflation updated' })
  async updatePromotionUsageInflation(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { multiplier: number },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setPromotionUsageInflation(body.multiplier, user.id, tenant.id);
    return {
      message: 'Promotion usage inflation multiplier updated successfully',
      promotion_usage_inflation: body.multiplier,
    };
  }

  @Put('social-proof/show-product-badges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle product order badges globally (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product order badges setting updated' })
  async updateShowProductOrderBadges(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setShowProductOrderBadges(body.enabled, user.id, tenant.id);
    return {
      message: `Product order badges ${body.enabled ? 'enabled' : 'disabled'} globally`,
      show_product_order_badges: body.enabled,
    };
  }

  @Put('social-proof/show-promotion-badges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle promotion usage badges globally (Admin only)' })
  @ApiResponse({ status: 200, description: 'Promotion usage badges setting updated' })
  async updateShowPromotionUsageBadges(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setShowPromotionUsageBadges(body.enabled, user.id, tenant.id);
    return {
      message: `Promotion usage badges ${body.enabled ? 'enabled' : 'disabled'} globally`,
      show_promotion_usage_badges: body.enabled,
    };
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public storefront settings (tenant-scoped with platform fallback)' })
  @ApiResponse({ status: 200, description: 'Public settings retrieved' })
  async getPublicSettings(@CurrentTenant() tenant: TenantContext) {
    const tenantId = tenant.id;
    const settings = await this.settingsService.getAllSettings(tenantId);
    return {
      guest_checkout_enabled: await this.settingsService.getGuestCheckoutEnabled(tenantId),
      payment_methods_config: await this.settingsService.getPaymentMethodsConfig(tenantId),
      enabled_payment_types: await this.settingsService.getEnabledPaymentTypes(tenantId),
      allow_image_upload: await this.settingsService.getAllowImageUpload(tenantId),
      allow_image_link: await this.settingsService.getAllowImageLink(tenantId),
      store_name: settings.store_name || settings.storeName,
      store_email: settings.store_email || settings.storeEmail,
      phone_number: settings.phone_number || settings.phoneNumber,
      whatsapp_number: settings.whatsapp_number || settings.whatsappNumber,
      store_address: settings.store_address || settings.address,
      delivery_banner_message: settings.delivery_banner_message || settings.deliveryMessage,
      promotional_banner: settings.promotional_banner || settings.promoBanner,
      about_us: settings.about_us || settings.aboutUs,
      contact_email: settings.contact_email || settings.contactEmail,
      opening_hours: settings.opening_hours || settings.openingHours,
      google_maps_embed_url: settings.google_maps_embed_url || settings.googleMapsEmbedUrl,
    };
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update system settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: Record<string, any>,
    @CurrentUser() user: any,
  ) {
    const tenantId = tenant.id;
    for (const [key, value] of Object.entries(body)) {
      await this.settingsService.setSetting(key, JSON.stringify(value), undefined, user.id, tenantId);
    }
    return { message: 'Settings updated successfully' };
  }
}

// ============================================
// PLATFORM SETTINGS (Super Admin only)
// ============================================

@ApiTags('platform-settings')
@Controller('platform/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class PlatformSettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all platform-level settings (Super Admin only)' })
  async getPlatformSettings() {
    const settings = await this.settingsService.getAllPlatformSettings();
    return {
      settings,
      platformOnlyKeys: [
        'platform_name',
        'platform_domain',
        'platform_subdomain_suffix',
        'platform_maintenance_mode',
        'default_trial_days',
        'default_plan_id',
        'marketplace_enabled',
        'marketplace_commission_percent',
        'global_rate_limit',
        'signup_enabled',
      ],
    };
  }

  @Put()
  @ApiOperation({ summary: 'Update platform-level settings (Super Admin only)' })
  async updatePlatformSettings(
    @Body() body: Record<string, any>,
    @CurrentUser() user: any,
  ) {
    for (const [key, value] of Object.entries(body)) {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.settingsService.setPlatformSetting(key, strValue, undefined, user.id);
    }
    return { message: 'Platform settings updated successfully' };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a single platform setting (Super Admin only)' })
  async updatePlatformSetting(
    @Param('key') key: string,
    @Body() body: { value: any; description?: string },
    @CurrentUser() user: any,
  ) {
    const strValue = typeof body.value === 'string' ? body.value : JSON.stringify(body.value);
    await this.settingsService.setPlatformSetting(key, strValue, body.description, user.id);
    return { message: `Platform setting '${key}' updated successfully` };
  }
}
