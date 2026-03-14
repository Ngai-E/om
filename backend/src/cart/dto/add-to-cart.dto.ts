import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'product-uuid', description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: 'variant-uuid', description: 'Product Variant ID (optional)' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 2, description: 'Quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
