import { Controller, Get, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Decimal } from '@prisma/client/runtime/library';

@ApiTags('tenant-payouts')
@Controller('tenant/payouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantPayoutsController {
  constructor(private platformService: PlatformService) { }

  @Get('balance')
  @ApiOperation({ summary: 'Get current tenant balance and earnings' })
  @ApiResponse({ status: 200, description: 'Tenant balance retrieved' })
  async getTenantBalance(@Req() req: any) {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new BadRequestException('No tenant found for request');
    }

    const balance = await this.platformService.getTenantBalance(tenantId);
    return { balance };
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get tenant\'s payout requests' })
  @ApiResponse({ status: 200, description: 'Payout requests retrieved' })
  async getPayoutRequests(@Req() req: any) {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new BadRequestException('No tenant found for request');
    }

    const result = await this.platformService.getPayouts(
      tenantId,
      undefined,
      1,
      20
    );
    return result;
  }

  @Post('request')
  @ApiOperation({ summary: 'Request a payout (tenant)' })
  @ApiResponse({ status: 201, description: 'Payout request created' })
  async requestPayout(
    @Body() body: {
      amount: number;
      paymentMethod: string;
      bankAccountName?: string;
      bankAccountNumber?: string;
      bankSortCode?: string;
      notes?: string;
    },
    @Req() req: any,
  ) {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new BadRequestException('No tenant found for request');
    }

    // Check if tenant has sufficient balance
    const balance = await this.platformService.getTenantBalance(tenantId);
    if (!balance || new Decimal(balance.currentBalance).lt(body.amount)) {
      throw new Error('Insufficient balance for payout request');
    }

    // Get platform fees
    const fees = await this.platformService.getPlatformFees();
    const grossAmount = new Decimal(body.amount);
    const platformFee = grossAmount.mul(fees.platformFeePercent).div(100);
    const taxAmount = grossAmount.mul(fees.taxPercent).div(100);
    const netAmount = grossAmount.sub(platformFee).sub(taxAmount);

    // Create payout request
    const payout = await this.platformService.createPayout({
      tenantId,
      amount: netAmount,
      grossAmount,
      platformFee,
      taxAmount,
      paymentMethod: body.paymentMethod,
      bankAccountName: body.bankAccountName,
      bankAccountNumber: body.bankAccountNumber,
      bankSortCode: body.bankSortCode,
      notes: body.notes,
      processedBy: null, // Will be set when approved by admin
    });

    return {
      message: 'Payout request submitted successfully',
      payout
    };
  }
}
