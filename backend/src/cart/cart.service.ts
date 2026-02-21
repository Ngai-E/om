import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      // Create cart with 24-hour expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      cart = await this.prisma.cart.create({
        data: {
          userId,
          expiresAt,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { sortOrder: 'asc' } },
                  inventory: true,
                },
              },
            },
          },
        },
      });
    }

    return this.calculateCartTotals(cart);
  }

  async addItem(userId: string, dto: AddToCartDto) {
    // Verify product exists and is available
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { inventory: true },
    });

    if (!product || !product.isActive || product.deletedAt) {
      throw new NotFoundException('Product not found');
    }

    // Check inventory
    if (product.inventory?.isTracked && product.inventory.quantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = cart.items.find((item) => item.productId === dto.productId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + dto.quantity;

      // Check inventory for new quantity
      if (product.inventory?.isTracked && product.inventory.quantity < newQuantity) {
        throw new BadRequestException('Insufficient stock');
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
        },
      });
    } else {
      // Add new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getOrCreateCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Check inventory
    if (item.product.inventory?.isTracked && item.product.inventory.quantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.getOrCreateCart(userId);
  }

  private calculateCartTotals(cart: any) {
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      ...cart,
      subtotal: subtotal.toFixed(2),
      itemCount,
    };
  }
}
