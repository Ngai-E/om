import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService, PaymentMethod } from './settings.service';
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
    
    // Return only public settings
    return {
      payment_method: settings.payment_method || PaymentMethod.STRIPE_CHECKOUT,
      store_name: settings.store_name || 'OMEGA AFRO SHOP',
      currency: settings.currency || 'GBP',
    };
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
