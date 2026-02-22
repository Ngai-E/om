import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckPostcodeDto, GetDeliverySlotsDto } from './dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a postcode is in a delivery zone and get delivery fee
   */
  async checkPostcode(dto: CheckPostcodeDto) {
    // Normalize postcode (remove spaces, uppercase)
    const normalizedPostcode = dto.postcode.replace(/\s/g, '').toUpperCase();
    
    // Extract postcode area (e.g., "BL1" from "BL11AA")
    // UK postcode outward code: 2-4 characters (area + district)
    // Examples: "BL1", "M1", "SW1A", "EC1A"
    // We want the area part only (letters + first 1-2 digits)
    const areaMatch = normalizedPostcode.match(/^([A-Z]{1,2})(\d{1,2})/);
    
    if (!areaMatch) {
      return {
        available: false,
        message: 'Invalid postcode format',
      };
    }

    const letters = areaMatch[1];
    const digits = areaMatch[2];
    
    // Try to find zone with exact match first (e.g., "BL1")
    // Then try with just first digit if it's 2 digits (e.g., "BL1" from "BL11")
    const possiblePrefixes = [
      `${letters}${digits}`,
      digits.length === 2 ? `${letters}${digits[0]}` : null,
    ].filter(Boolean) as string[];

    // Find delivery zone that covers this postcode
    const zone = await this.prisma.deliveryZone.findFirst({
      where: {
        isActive: true,
        postcodePrefix: {
          hasSome: possiblePrefixes,
        },
      },
    });

    if (!zone) {
      return {
        available: false,
        message: `Sorry, we don't deliver to ${dto.postcode} yet`,
        postcodePrefix: possiblePrefixes[0],
      };
    }

    return {
      available: true,
      zone: {
        id: zone.id,
        name: zone.name,
        deliveryFee: zone.deliveryFee,
        minOrderValue: zone.minOrderValue,
        freeDeliveryThreshold: zone.freeDeliveryThreshold,
      },
      message: `Delivery available to ${dto.postcode}`,
    };
  }

  /**
   * Get all active delivery zones
   */
  async getZones() {
    const zones = await this.prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return {
      zones: zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        postcodePrefix: zone.postcodePrefix,
        deliveryFee: zone.deliveryFee,
        minOrderValue: zone.minOrderValue,
        freeDeliveryThreshold: zone.freeDeliveryThreshold,
      })),
      total: zones.length,
    };
  }

  /**
   * Get available delivery slots
   */
  async getAvailableSlots(dto: GetDeliverySlotsDto) {
    const where: any = { isActive: true };

    // Filter by date if provided
    if (dto.date) {
      where.date = new Date(dto.date);
    } else {
      // Default: only show future slots (today onwards)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.date = {
        gte: today,
      };
    }

    const slots = await this.prisma.deliverySlot.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
      take: 50, // Limit to next 50 slots
    });

    return {
      slots: slots.map((slot) => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        currentOrders: slot._count.orders,
        available: slot._count.orders < slot.capacity,
        displayTime: this.formatTimeSlot(slot.date, slot.startTime, slot.endTime),
      })),
      total: slots.length,
    };
  }

  /**
   * Get a specific delivery slot
   */
  async getSlot(slotId: string) {
    const slot = await this.prisma.deliverySlot.findUnique({
      where: { id: slotId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Delivery slot not found');
    }

    return {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      currentOrders: slot._count.orders,
      available: slot._count.orders < slot.capacity,
      isActive: slot.isActive,
      displayTime: this.formatTimeSlot(slot.date, slot.startTime, slot.endTime),
    };
  }

  /**
   * Calculate delivery fee for an order
   */
  async calculateDeliveryFee(zoneId: string, orderTotal: number) {
    const zone = await this.prisma.deliveryZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      throw new NotFoundException('Delivery zone not found');
    }

    if (!zone.isActive) {
      throw new NotFoundException('Delivery zone is not active');
    }

    // Check minimum order value
    if (orderTotal < Number(zone.minOrderValue)) {
      return {
        fee: Number(zone.deliveryFee),
        minOrderValue: Number(zone.minOrderValue),
        freeDeliveryThreshold: zone.freeDeliveryThreshold ? Number(zone.freeDeliveryThreshold) : null,
        isFree: false,
        message: `Minimum order value is £${zone.minOrderValue}`,
      };
    }

    // Check if eligible for free delivery
    const isFree = zone.freeDeliveryThreshold && orderTotal >= Number(zone.freeDeliveryThreshold);

    return {
      fee: isFree ? 0 : Number(zone.deliveryFee),
      minOrderValue: Number(zone.minOrderValue),
      freeDeliveryThreshold: zone.freeDeliveryThreshold ? Number(zone.freeDeliveryThreshold) : null,
      isFree,
      message: isFree 
        ? 'Free delivery!' 
        : `Delivery fee: £${zone.deliveryFee}`,
    };
  }

  /**
   * Validate cart against delivery zone requirements
   */
  async validateCartForDelivery(userId: string, addressId?: string) {
    // Get user's cart
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        isValid: false,
        canProceed: false,
        message: 'Your cart is empty',
        subtotal: 0,
      };
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    // If no address selected, just return cart info
    if (!addressId) {
      return {
        isValid: true,
        canProceed: true,
        subtotal,
        message: 'Please select a delivery address',
      };
    }

    // Get address with delivery zone
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
      include: { deliveryZone: true },
    });

    if (!address) {
      return {
        isValid: false,
        canProceed: false,
        message: 'Address not found',
        subtotal,
      };
    }

    if (!address.deliveryZone) {
      return {
        isValid: false,
        canProceed: false,
        message: 'This address is not in a delivery zone. Please contact support or choose collection.',
        subtotal,
      };
    }

    const zone = address.deliveryZone;

    // Check minimum order value
    const minOrderValue = Number(zone.minOrderValue);
    const freeDeliveryThreshold = zone.freeDeliveryThreshold ? Number(zone.freeDeliveryThreshold) : null;
    const deliveryFee = Number(zone.deliveryFee);

    if (subtotal < minOrderValue) {
      const amountNeeded = minOrderValue - subtotal;
      return {
        isValid: false,
        canProceed: false,
        subtotal,
        minOrderValue,
        amountNeeded,
        deliveryFee,
        freeDeliveryThreshold,
        zoneName: zone.name,
        message: `Minimum order value for ${zone.name} is £${minOrderValue.toFixed(2)}. Add £${amountNeeded.toFixed(2)} more to proceed.`,
      };
    }

    // Check if eligible for free delivery
    const isFreeDelivery = freeDeliveryThreshold && subtotal >= freeDeliveryThreshold;
    const finalDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
    const total = subtotal + finalDeliveryFee;

    let message = `Delivery fee: £${finalDeliveryFee.toFixed(2)}`;
    if (isFreeDelivery) {
      message = '🎉 You qualify for free delivery!';
    } else if (freeDeliveryThreshold) {
      const amountForFree = freeDeliveryThreshold - subtotal;
      if (amountForFree > 0) {
        message = `Add £${amountForFree.toFixed(2)} more for free delivery!`;
      }
    }

    return {
      isValid: true,
      canProceed: true,
      subtotal,
      minOrderValue,
      deliveryFee: finalDeliveryFee,
      freeDeliveryThreshold,
      isFreeDelivery,
      total,
      zoneName: zone.name,
      message,
    };
  }

  /**
   * Helper: Format time slot for display
   */
  private formatTimeSlot(date: Date, startTime: string, endTime: string): string {
    const formatDate = (d: Date) => {
      return d.toLocaleDateString('en-GB', { 
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    };

    return `${formatDate(date)} ${startTime} - ${endTime}`;
  }
}
