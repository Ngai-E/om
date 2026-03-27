import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

class InventoryDto {
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isTracked?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Plantain' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Fresh green plantains from the Caribbean', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1.49 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 2.99, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'kg', required: false, description: 'Legacy field, use unitSize instead' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: '1kg', required: false })
  @IsOptional()
  @IsString()
  unitSize?: string;

  @ApiProperty({ example: ['plantain', 'caribbean', 'fresh'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 0, required: false, description: 'Order count for social proof (can be manually updated)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderCount?: number;

  @ApiProperty({ type: [ImageDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];

  @ApiProperty({ type: InventoryDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => InventoryDto)
  inventory?: InventoryDto;

  // Legacy fields for backward compatibility
  @ApiProperty({ example: 'VEGETABLES', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 'SKU-12345', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: '1234567890123', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;
}
