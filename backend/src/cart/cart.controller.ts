import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantRequiredGuard } from '../common/guards/tenant-required.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantContext } from '../common/interfaces/tenant-context.interface';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard, TenantRequiredGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  async getCart(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: any) {
    return this.cartService.getOrCreateCart(user.id, tenant.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  async addItem(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: any, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(user.id, dto, tenant.id);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  async updateItem(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, itemId, dto, tenant.id);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeItem(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: any, @Param('id') itemId: string) {
    return this.cartService.removeItem(user.id, itemId, tenant.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: any) {
    return this.cartService.clearCart(user.id, tenant.id);
  }
}
