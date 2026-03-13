import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService, PaymentMethod, PaymentMethodsConfig, PaymentType } from './settings.service';
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
    
    // Return only public settings
    return {
      payment_method: settings.payment_method || PaymentMethod.STRIPE_CHECKOUT,
      payment_methods_config: paymentMethodsConfig,
      enabled_payment_types: enabledPaymentTypes,
      store_name: settings.store_name || 'OMEGA AFRO SHOP',
      currency: settings.currency || 'GBP',
      guest_checkout_enabled: guestCheckoutEnabled,
      email_notifications_enabled: emailNotificationsEnabled,
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
