import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('delivery-slots')
@Controller('delivery-slots')
export class DeliveryTemplatesController {
  constructor(private prisma: PrismaService) {}

  // Get available slots for a specific date (public)
  @Get('available')
  @ApiOperation({ summary: 'Get available delivery slots for a date' })
  async getAvailableSlots(@Query('date') dateStr: string) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    // Get templates for this day of week
    const templates = await this.prisma.deliverySlotTemplate.findMany({
      where: {
        dayOfWeek,
        isActive: true,
      },
    });

    // Check for overrides
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const overrides = await this.prisma.deliverySlotOverride.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // Merge templates with overrides and count bookings
    const slots = await Promise.all(
      templates.map(async (template) => {
        const override = overrides.find(o => 
          o.startTime === template.startTime && o.endTime === template.endTime
        );

        if (override?.isDisabled) return null;

        const startTime = override?.startTime || template.startTime;
        const endTime = override?.endTime || template.endTime;
        const capacity = override?.capacity || template.capacity;

        // Count existing orders for this slot
        const currentOrders = await this.prisma.order.count({
          where: {
            deliverySlot: {
              date: {
                gte: startOfDay,
                lt: endOfDay,
              },
              startTime,
              endTime,
            },
          },
        });

        const available = currentOrders < capacity;

        return {
          id: override?.id || template.id,
          startTime,
          endTime,
          capacity,
          currentOrders,
          available,
          date: dateStr,
        };
      })
    );

    return slots.filter(Boolean);
  }

  // Admin: Get all templates
  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all delivery slot templates (Admin)' })
  async getTemplates() {
    return this.prisma.deliverySlotTemplate.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  // Admin: Create template
  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create delivery slot template (Admin)' })
  async createTemplate(@Body() data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    capacity: number;
  }) {
    return this.prisma.deliverySlotTemplate.create({ data });
  }

  // Admin: Update template
  @Put('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update delivery slot template (Admin)' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.prisma.deliverySlotTemplate.update({
      where: { id },
      data,
    });
  }

  // Admin: Delete template
  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete delivery slot template (Admin)' })
  async deleteTemplate(@Param('id') id: string) {
    await this.prisma.deliverySlotTemplate.delete({ where: { id } });
    return { message: 'Template deleted' };
  }

  // Admin: Create override
  @Post('overrides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create delivery slot override (Admin)' })
  async createOverride(@Body() data: {
    date: string;
    startTime: string;
    endTime: string;
    capacity?: number;
    isDisabled?: boolean;
  }) {
    return this.prisma.deliverySlotOverride.create({
      data: {
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity || 10,
        isDisabled: data.isDisabled || false,
      },
    });
  }

  // Admin: Get overrides
  @Get('overrides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get delivery slot overrides (Admin)' })
  async getOverrides(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const where: any = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.deliverySlotOverride.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  // Admin: Delete override
  @Delete('overrides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete delivery slot override (Admin)' })
  async deleteOverride(@Param('id') id: string) {
    await this.prisma.deliverySlotOverride.delete({ where: { id } });
    return { message: 'Override deleted' };
  }
}
