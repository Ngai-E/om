import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Get('tenants')
  @ApiOperation({ summary: 'Get all active tenants for marketplace' })
  @ApiResponse({ status: 200, description: 'Active tenants retrieved' })
  async getTenants(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const tenants = await this.marketplaceService.getActiveTenants({
      search,
      category,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });

    return { tenants };
  }

  @Get('featured-stores')
  @ApiOperation({ summary: 'Get featured stores for marketplace homepage' })
  @ApiResponse({ status: 200, description: 'Featured stores retrieved' })
  async getFeaturedStores() {
    const featured = await this.marketplaceService.getFeaturedStores();
    return { featured };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get marketplace categories with store counts' })
  @ApiResponse({ status: 200, description: 'Categories retrieved' })
  async getCategories() {
    const categories = await this.marketplaceService.getCategories();
    return { categories };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products across all tenants' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async searchProducts(
    @Query('q') query: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!query) {
      return { products: [], total: 0 };
    }

    const results = await this.marketplaceService.searchProducts(query, {
      tenantId,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });

    return results;
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending products across marketplace' })
  @ApiResponse({ status: 200, description: 'Trending products retrieved' })
  async getTrendingProducts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const trending = await this.marketplaceService.getTrendingProducts({
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });

    return trending;
  }
}
