import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CheckPostcodeDto, GetDeliverySlotsDto } from './dto';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Post('check-postcode')
  @ApiOperation({ summary: 'Check if postcode is in delivery zone' })
  @ApiResponse({ status: 200, description: 'Postcode checked' })
  async checkPostcode(@Body() dto: CheckPostcodeDto) {
    return this.deliveryService.checkPostcode(dto);
  }

  @Get('zones')
  @ApiOperation({ summary: 'Get all delivery zones' })
  @ApiResponse({ status: 200, description: 'Zones retrieved' })
  async getZones() {
    return this.deliveryService.getZones();
  }

  @Get('slots')
  @ApiOperation({ summary: 'Get available delivery slots' })
  @ApiQuery({ name: 'zoneId', required: false, description: 'Filter by zone ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Slots retrieved' })
  async getAvailableSlots(@Query() dto: GetDeliverySlotsDto) {
    return this.deliveryService.getAvailableSlots(dto);
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
  @ApiOperation({ summary: 'Calculate delivery fee' })
  @ApiParam({ name: 'zoneId', description: 'Zone ID' })
  @ApiQuery({ name: 'orderTotal', required: true, description: 'Order total amount' })
  @ApiResponse({ status: 200, description: 'Fee calculated' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async calculateFee(
    @Param('zoneId') zoneId: string,
    @Query('orderTotal') orderTotal: string,
  ) {
    return this.deliveryService.calculateDeliveryFee(zoneId, parseFloat(orderTotal));
  }
}
