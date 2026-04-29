import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CheckPostcodeDto, GetDeliverySlotsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantRequiredGuard } from '../common/guards/tenant-required.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantContext } from '../common/interfaces/tenant-context.interface';

@ApiTags('delivery')
@Controller('delivery')
@UseGuards(TenantRequiredGuard)
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Post('check-postcode')
  @ApiOperation({ summary: 'Check if postcode is in delivery zone' })
  @ApiResponse({ status: 200, description: 'Postcode checked' })
  async checkPostcode(@CurrentTenant() tenant: TenantContext, @Body() dto: CheckPostcodeDto) {
    return this.deliveryService.checkPostcode(dto, tenant.id);
  }

  @Get('zones')
  @ApiOperation({ summary: 'Get all delivery zones' })
  @ApiResponse({ status: 200, description: 'Zones retrieved' })
  async getZones(@CurrentTenant() tenant: TenantContext) {
    return this.deliveryService.getZones(tenant.id);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Get available delivery slots' })
  @ApiQuery({ name: 'zoneId', required: false, description: 'Filter by zone ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Slots retrieved' })
  async getAvailableSlots(@CurrentTenant() tenant: TenantContext, @Query() dto: GetDeliverySlotsDto) {
    return this.deliveryService.getAvailableSlots(dto, tenant.id);
  }

  @Get('slots/:id')
  @ApiOperation({ summary: 'Get delivery slot details' })
  @ApiParam({ name: 'id', description: 'Slot ID' })
  @ApiResponse({ status: 200, description: 'Slot found' })
  @ApiResponse({ status: 404, description: 'Slot not found' })
  async getSlot(@Param('id') slotId: string) {
    return this.deliveryService.getSlot(slotId);
  }

  @Get('zones/:zoneId/fee')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate delivery fee for zone' })
  @ApiParam({ name: 'zoneId', description: 'Zone ID' })
  @ApiQuery({ name: 'orderTotal', required: true, description: 'Order total amount' })
  @ApiResponse({ status: 200, description: 'Fee calculated' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async calculateDeliveryFee(
    @Param('zoneId') zoneId: string,
    @Query('orderTotal') orderTotal: string,
  ) {
    return this.deliveryService.calculateDeliveryFee(zoneId, parseFloat(orderTotal));
  }

  @Get('validate-cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate cart against delivery zone requirements' })
  async validateCart(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Query('addressId') addressId?: string,
  ) {
    return this.deliveryService.validateCartForDelivery(user.id, addressId, tenant.id);
  }
}
