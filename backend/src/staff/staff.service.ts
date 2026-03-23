import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhoneOrderDto } from './dto';
import { StripeService } from '../payments/stripe.service';
import { PromotionsService } from '../promotions/promotions.service';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private promotionsService: PromotionsService,
  ) {}

  /**
   * Create order via phone (staff feature)
   */
  async createPhoneOrder(staffId: string, dto: CreatePhoneOrderDto) {
    // Find customer
    const user = await this.prisma.user.findUnique({
      where: { id: dto.customerId },
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { inventory: true },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product "${product.name}" is not available`);
      }

      // Check inventory
      if (product.inventory && product.inventory.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.inventory.quantity}`,
        );
      }

      const itemSubtotal = Number(product.price) * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });

      // Deduct inventory
      if (product.inventory) {
        await this.prisma.inventory.update({
          where: { productId: product.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Calculate delivery fee
    let deliveryFee = 0;
    if (dto.fulfillmentType === 'DELIVERY' && dto.addressId) {
      const address = await this.prisma.address.findUnique({
        where: { id: dto.addressId },
        include: { deliveryZone: true },
      });

      if (address?.deliveryZone) {
        deliveryFee = Number(address.deliveryZone.deliveryFee);
        
        // Check for free delivery
        if (
          address.deliveryZone.freeDeliveryThreshold &&
          subtotal >= Number(address.deliveryZone.freeDeliveryThreshold)
        ) {
          deliveryFee = 0;
        }
      }
    }

    // Apply promotions
    const isFirstOrder = await this.isFirstOrder(user.id);
    const promotionContext = {
      userId: user.id,
      subtotal,
      deliveryFee,
      fulfillmentType: dto.fulfillmentType,
      isFirstOrder,
      isGuest: false,
      promoCode: dto.promoCode,
    };

    const promotionResult = await this.promotionsService.applyPromotions(promotionContext);
    const discountTotal = promotionResult.totalDiscount;

    // Calculate final total
    const total = subtotal + deliveryFee - discountTotal;

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        orderNumber: this.generateOrderNumber(),
        status: 'RECEIVED',
        fulfillmentType: dto.fulfillmentType,
        subtotal,
        deliveryFee,
        discountTotal,
        total,
        isPhoneOrder: true, // Mark as phone order
        addressId: dto.addressId || undefined, // Convert empty string to undefined
        deliverySlotId: dto.deliverySlotId || undefined, // Convert empty string to undefined
        notes: dto.notes || undefined,
        staffNotes: `Phone order created by staff ID: ${staffId}`,
        items: {
          create: orderItems,
        },
        promotionRedemptions: {
          create: promotionResult.redemptions.map(r => ({
            promotionId: r.promotionId,
            userId: user.id,
            discountAmount: r.discountAmount,
            appliedToSubtotal: r.appliedToSubtotal,
            appliedToDelivery: r.appliedToDelivery,
          })),
        },
        statusHistory: {
          create: {
            status: 'RECEIVED',
            notes: 'Phone order created',
            createdBy: staffId,
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        address: true,
        deliverySlot: true,
        payment: true,
      },
    });

    // If payment method is CARD, create payment link automatically
    if (dto.paymentMethod === 'CARD') {
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const successUrl = `${frontendUrl}/order-confirmation?orderId=${order.id}`;
        const cancelUrl = `${frontendUrl}/checkout?orderId=${order.id}`;

        // Prepare order data for Stripe Checkout
        const orderData = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          items: orderItems.map(item => ({
            name: item.productName,
            price: Number(item.productPrice),
            quantity: item.quantity,
          })),
          total: Number(total),
          deliveryFee: deliveryFee,
        };

        const { url: paymentLink, sessionId } = await this.stripeService.createCheckoutSession(
          orderData,
          successUrl,
          cancelUrl,
        );

        // Create payment record with link and session ID
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            stripePaymentLinkId: paymentLink,
            stripeCheckoutSessionId: sessionId,
            amount: total,
            currency: 'GBP',
            status: 'PENDING',
            paymentMethod: 'CARD',
          },
        });

        // Refetch order with payment link
        const updatedOrder = await this.prisma.order.findUnique({
          where: { id: order.id },
          include: {
            items: { include: { product: true } },
            user: { select: { email: true, firstName: true, lastName: true, phone: true } },
            address: true,
            deliverySlot: true,
            payment: true,
          },
        });
        
        return updatedOrder || order;
      } catch (error) {
        console.error('Failed to create payment link:', error);
        // Don't fail the order creation, just log the error
      }
    } else if (dto.paymentMethod === 'CASH_ON_DELIVERY' || dto.paymentMethod === 'PAY_IN_STORE') {
      // Create payment record for COD or Pay in Store
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          currency: 'GBP',
          status: 'PENDING',
          paymentMethod: dto.paymentMethod,
        },
      });
    }

    return order;
  }

  /**
   * Search customers by email, phone, or name
   */
  async searchCustomers(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();

    const customers = await this.prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        addresses: {
          select: {
            id: true,
            label: true,
            line1: true,
            line2: true,
            city: true,
            postcode: true,
            isDefault: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      take: 10,
    });

    return customers;
  }

  /**
   * Get customer addresses for phone orders
   */
  async getCustomerAddresses(customerId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId: customerId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return addresses;
  }

  /**
   * Get dashboard task counts for staff
   */
  async getDashboardTasks() {
    const [newOrders, picking, ready] = await Promise.all([
      this.prisma.order.count({
        where: { status: 'RECEIVED' },
      }),
      this.prisma.order.count({
        where: { status: 'PICKING' },
      }),
      this.prisma.order.count({
        where: { status: 'OUT_FOR_DELIVERY' },
      }),
    ]);

    return {
      newOrders,
      picking,
      packing: ready, // Return as 'packing' for backward compatibility
    };
  }

  /**
   * Get orders for staff (simplified view)
   */
  async getStaffOrders(status?: string) {
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    console.log('Staff orders query - where:', where);

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        address: true,
        deliverySlot: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    console.log('Staff orders found:', orders.length);

    return orders;
  }

  /**
   * Get order details for staff
   */
  async getOrderDetails(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        address: true,
        deliverySlot: true,
        items: {
          include: {
            product: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Update order status (staff workflow)
   */
  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        statusHistory: {
          create: {
            status: status as any,
            notes: `Status updated by staff`,
          },
        },
      },
      include: {
        user: true,
        items: true,
      },
    });

    return order;
  }

  /**
   * Get recent orders for quick reference
   */
  async getRecentOrders(limit = 20) {
    const orders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        payment: {
          select: {
            status: true,
            paymentMethod: true,
          },
        },
      },
    });

    return orders;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private async isFirstOrder(userId: string): Promise<boolean> {
    const orderCount = await this.prisma.order.count({
      where: { userId },
    });

    return orderCount === 0;
  }
}
