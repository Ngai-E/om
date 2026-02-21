import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FulfillmentType } from '@prisma/client';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Get user's cart
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate inventory for all items
    for (const item of cart.items) {
      if (item.product.inventory?.isTracked && item.product.inventory.quantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${item.product.name}`);
      }
    }

    // Validate fulfillment requirements
    if (dto.fulfillmentType === FulfillmentType.DELIVERY) {
      if (!dto.addressId) {
        throw new BadRequestException('Address is required for delivery orders');
      }

      // Verify address belongs to user
      const address = await this.prisma.address.findFirst({
        where: { id: dto.addressId, userId },
        include: { deliveryZone: true },
      });

      if (!address) {
        throw new NotFoundException('Address not found');
      }

      if (!address.deliveryZone) {
        throw new BadRequestException('Address is not in a delivery zone');
      }
    }

    // Verify delivery slot if provided
    if (dto.deliverySlotId) {
      const slot = await this.prisma.deliverySlot.findUnique({
        where: { id: dto.deliverySlotId },
      });

      if (!slot || !slot.isActive) {
        throw new BadRequestException('Invalid delivery slot');
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    // Calculate delivery fee
    let deliveryFee = 0;
    if (dto.fulfillmentType === FulfillmentType.DELIVERY && dto.addressId) {
      const address = await this.prisma.address.findUnique({
        where: { id: dto.addressId },
        include: { deliveryZone: true },
      });

      if (address?.deliveryZone) {
        const zone = address.deliveryZone;
        // Check if order qualifies for free delivery
        if (zone.freeDeliveryThreshold && subtotal >= Number(zone.freeDeliveryThreshold)) {
          deliveryFee = 0;
        } else if (subtotal >= Number(zone.minOrderValue)) {
          deliveryFee = Number(zone.deliveryFee);
        } else {
          throw new BadRequestException(
            `Minimum order value for this area is £${zone.minOrderValue}`,
          );
        }
      }
    }

    const total = subtotal + deliveryFee;

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNumber: this.generateOrderNumber(),
        status: 'RECEIVED',
        fulfillmentType: dto.fulfillmentType,
        subtotal,
        deliveryFee,
        total,
        addressId: dto.addressId,
        deliverySlotId: dto.deliverySlotId,
        notes: dto.notes,
        items: {
          create: cart.items.map((item) => {
            const itemSubtotal = Number(item.product.price) * item.quantity;
            return {
              productId: item.productId,
              quantity: item.quantity,
              productPrice: item.product.price,
              productName: item.product.name,
              subtotal: itemSubtotal,
            };
          }),
        },
        statusHistory: {
          create: {
            status: 'RECEIVED',
            notes: 'Order created',
          },
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        address: {
          include: {
            deliveryZone: true,
          },
        },
        deliverySlot: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Update inventory
    for (const item of cart.items) {
      if (item.product.inventory?.isTracked) {
        await this.prisma.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Clear cart
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
          address: true,
          deliverySlot: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        address: {
          include: {
            deliveryZone: true,
          },
        },
        deliverySlot: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        statusHistory: {
          create: {
            status: dto.status,
            notes: dto.notes,
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        deliverySlot: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return updatedOrder;
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    // Restore inventory
    for (const item of order.items) {
      if (item.product.inventory?.isTracked) {
        await this.prisma.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // Update order status
    return this.updateStatus(orderId, {
      status: 'CANCELLED',
      notes: 'Order cancelled by customer',
    });
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}
