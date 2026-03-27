import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService, PaymentMethod, PaymentMethodsConfig, PaymentType, ImageUploadService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings (public)' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getSettings() {
    const settings = await this.settingsService.getAllSettings();
    const paymentMethodsConfig = await this.settingsService.getPaymentMethodsConfig();
    const enabledPaymentTypes = await this.settingsService.getEnabledPaymentTypes();
    const guestCheckoutEnabled = await this.settingsService.getGuestCheckoutEnabled();
    const emailNotificationsEnabled = await this.settingsService.getEmailNotificationsEnabled();
    const allowImageUpload = await this.settingsService.getAllowImageUpload();
    const allowImageLink = await this.settingsService.getAllowImageLink();
    const imageUploadService = await this.settingsService.getImageUploadService();
    const imgbbApiKey = await this.settingsService.getImgbbApiKey();
    const cloudinaryConfig = await this.settingsService.getCloudinaryConfig();
    const productOrdersInflation = await this.settingsService.getProductOrdersInflation();
    const promotionUsageInflation = await this.settingsService.getPromotionUsageInflation();
    const showProductOrderBadges = await this.settingsService.getShowProductOrderBadges();
    const showPromotionUsageBadges = await this.settingsService.getShowPromotionUsageBadges();
    
    // Return only public settings (hide sensitive API keys/secrets)
    return {
      payment_method: settings.payment_method || PaymentMethod.STRIPE_CHECKOUT,
      payment_methods_config: paymentMethodsConfig,
      enabled_payment_types: enabledPaymentTypes,
      store_name: settings.store_name || 'OMEGA AFRO SHOP',
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
  async getGuestCheckoutStatus() {
    const enabled = await this.settingsService.getGuestCheckoutEnabled();
    return { enabled };
  }

  @Get('payment-method')
  @ApiOperation({ summary: 'Get current payment method' })
  @ApiResponse({ status: 200, description: 'Payment method retrieved' })
  async getPaymentMethod() {
    const method = await this.settingsService.getPaymentMethod();
    return { payment_method: method };
  }

  @Put('payment-method')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment method (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment method updated' })
  async updatePaymentMethod(
    @Body() body: { payment_method: PaymentMethod },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setPaymentMethod(body.payment_method, user.id);
    return { message: 'Payment method updated successfully', payment_method: body.payment_method };
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get payment methods configuration' })
  @ApiResponse({ status: 200, description: 'Payment methods config retrieved' })
  async getPaymentMethodsConfig() {
    const config = await this.settingsService.getPaymentMethodsConfig();
    const enabledTypes = await this.settingsService.getEnabledPaymentTypes();
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
    @Body() body: { config: PaymentMethodsConfig },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setPaymentMethodsConfig(body.config, user.id);
    const enabledTypes = await this.settingsService.getEnabledPaymentTypes();
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
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setGuestCheckoutEnabled(body.enabled, user.id);
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
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setEmailNotificationsEnabled(body.enabled, user.id);
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
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setAllowImageUpload(body.enabled, user.id);
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
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setAllowImageLink(body.enabled, user.id);
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
    @Body() body: { service: ImageUploadService },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setImageUploadService(body.service, user.id);
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
    @Body() body: { apiKey: string },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setImgbbApiKey(body.apiKey, user.id);
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
    @Body() body: { cloudName: string; apiKey: string; apiSecret: string },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setCloudinaryConfig(body, user.id);
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
  async getUploadConfig() {
    const service = await this.settingsService.getImageUploadService();
    const imgbbApiKey = await this.settingsService.getImgbbApiKey();
    const cloudinaryConfig = await this.settingsService.getCloudinaryConfig();
    
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
    @Body() body: { multiplier: number },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setProductOrdersInflation(body.multiplier, user.id);
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
    @Body() body: { multiplier: number },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setPromotionUsageInflation(body.multiplier, user.id);
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
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setShowProductOrderBadges(body.enabled, user.id);
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
    @Body() body: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    await this.settingsService.setShowPromotionUsageBadges(body.enabled, user.id);
    return {
      message: `Promotion usage badges ${body.enabled ? 'enabled' : 'disabled'} globally`,
      show_promotion_usage_badges: body.enabled,
    };
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update system settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @Body() body: Record<string, any>,
    @CurrentUser() user: any,
  ) {
    for (const [key, value] of Object.entries(body)) {
      await this.settingsService.setSetting(key, JSON.stringify(value), undefined, user.id);
    }
    return { message: 'Settings updated successfully' };
  }
}
