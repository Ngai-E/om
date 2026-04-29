import { Controller, Post, Body, Get, Query, BadRequestException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { GuestCheckoutService } from './guest-checkout.service';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';
import { SettingsService } from '../settings/settings.service';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth/guest')
export class GuestCheckoutController {
  constructor(
    private guestCheckoutService: GuestCheckoutService,
    private settingsService: SettingsService,
    private jwtService: JwtService,
  ) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create or find guest user for checkout' })
  @ApiResponse({ status: 201, description: 'Guest user created/found' })
  @ApiResponse({ status: 400, description: 'Email/phone already registered' })
  @ApiResponse({ status: 403, description: 'Guest checkout is disabled' })
  async guestCheckout(@Req() req: Request, @Body() dto: GuestCheckoutDto) {
    const tenantId = (req as any).tenantId;
    // Check if guest checkout is enabled
    const guestCheckoutEnabled = await this.settingsService.getGuestCheckoutEnabled(tenantId);
    
    if (!guestCheckoutEnabled) {
      throw new BadRequestException('Guest checkout is currently disabled. Please create an account to continue.');
    }

    const result = await this.guestCheckoutService.findOrCreateGuestUser(dto, tenantId);
    
    // Generate JWT token for the user
    const payload = { 
      sub: result.user.id, 
      email: result.user.email, 
      role: 'CUSTOMER' 
    };
    const token = this.jwtService.sign(payload);

    return {
      ...result,
      token,
    };
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get guest user addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved' })
  async getGuestAddresses(
    @Query('email') email: string,
    @Query('phone') phone: string,
  ) {
    return this.guestCheckoutService.getGuestAddresses(email, phone);
  }
}
