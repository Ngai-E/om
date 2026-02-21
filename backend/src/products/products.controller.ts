import { Controller, Get, Query, Param, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
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
    @Query('categoryId') categoryId?: string,
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
      categoryId,
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
  async getFeatured(@Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit?: number) {
    return this.productsService.getFeatured(limit);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with product counts' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
