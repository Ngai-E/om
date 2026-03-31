import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: string, tenantId?: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId, ...(tenantId && { tenantId }) },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
                inventory: true,
              },
            },
            variant: true, // Include variant data
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
          ...(tenantId && { tenantId }),
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
              variant: true, // Include variant data
            },
          },
        },
      });
    }

    return this.calculateCartTotals(cart);
  }

  async addItem(userId: string, dto: AddToCartDto, tenantId?: string) {
    // Verify product exists and is available
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { 
        inventory: true,
        variants: true,
      },
    });

    if (!product || !product.isActive || product.deletedAt) {
      throw new NotFoundException('Product not found');
    }

    // Check if product has variants - if so, variantId is required
    const hasVariants = product.variants && product.variants.length > 0;
    if (hasVariants && !dto.variantId) {
      throw new BadRequestException('This product requires a variant selection');
    }

    // If variantId is provided, verify it exists and belongs to this product
    let variant = null;
    if (dto.variantId) {
      variant = await this.prisma.productVariant.findFirst({
        where: { 
          id: dto.variantId,
          productId: dto.productId,
          isActive: true,
        },
      });

      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }

      // Check variant stock
      if (variant.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock for this variant');
      }
    } else {
      // Check product inventory (for non-variant products)
      if (product.inventory?.isTracked && product.inventory.quantity < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId, tenantId);

    // Check if item already exists in cart (same product AND variant)
    const existingItem = cart.items.find((item) => 
      item.productId === dto.productId && 
      item.variantId === (dto.variantId || null)
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + dto.quantity;

      // Check inventory for new quantity
      if (variant) {
        if (variant.stock < newQuantity) {
          throw new BadRequestException('Insufficient stock for this variant');
        }
      } else if (product.inventory?.isTracked && product.inventory.quantity < newQuantity) {
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
          variantId: dto.variantId || null,
          quantity: dto.quantity,
        },
      });
    }

    return this.getOrCreateCart(userId, tenantId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto, tenantId?: string) {
    const cart = await this.getOrCreateCart(userId, tenantId);

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

    return this.getOrCreateCart(userId, tenantId);
  }

  async removeItem(userId: string, itemId: string, tenantId?: string) {
    const cart = await this.getOrCreateCart(userId, tenantId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getOrCreateCart(userId, tenantId);
  }

  async clearCart(userId: string, tenantId?: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, ...(tenantId && { tenantId }) },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.getOrCreateCart(userId, tenantId);
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
