import { Controller, Get, Query, Param, ParseIntPipe, DefaultValuePipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Request } from 'express';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category slug' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in product name and description' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter' })
  @ApiQuery({ name: 'tags', required: false, type: [String], description: 'Filter by tags' })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean, description: 'Filter featured products' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive products (admin only)' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findAll(
    @Req() req: Request,
    @Query('categoryId') categoryId?: string,
    @Query('category') categorySlug?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('tags') tags?: string | string[],
    @Query('isFeatured') isFeatured?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.productsService.findAll({
      tenantId: (req as any).tenantId,
      categoryId,
      categorySlug,
      search,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : undefined,
      isFeatured: isFeatured === true || isFeatured === 'true' as any ? true : undefined,
      page,
      limit,
      includeInactive: includeInactive === true || includeInactive === 'true' as any,
    });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return (default: 8)' })
  @ApiResponse({ status: 200, description: 'Featured products retrieved successfully' })
  async getFeatured(@Req() req: Request, @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit?: number) {
    return this.productsService.getFeatured(limit, (req as any).tenantId);
  }

  @Get('best-sellers')
  @ApiOperation({ summary: 'Get best seller products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return (default: 8)' })
  @ApiResponse({ status: 200, description: 'Best seller products retrieved successfully' })
  async getBestSellers(@Req() req: Request, @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit?: number) {
    return this.productsService.getBestSellers(limit, (req as any).tenantId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with product counts' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(@Req() req: Request) {
    return this.productsService.getCategories((req as any).tenantId);
  }

  @Get('categories/quick')
  @ApiOperation({ summary: 'Get quick categories or top 5 by product count' })
  @ApiResponse({ status: 200, description: 'Quick categories retrieved successfully' })
  async getQuickCategories(@Req() req: Request) {
    return this.productsService.getQuickCategories((req as any).tenantId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySlug(@Req() req: Request, @Param('slug') slug: string) {
    return this.productsService.findBySlug(slug, (req as any).tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    return this.productsService.findOne(id, (req as any).tenantId);
  }
}
