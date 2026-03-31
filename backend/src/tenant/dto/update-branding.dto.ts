import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsJSON } from 'class-validator';

export class UpdateBrandingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiProperty({ example: '#036637', required: false })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({ example: '#FF7730', required: false })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiProperty({ example: 'Inter', required: false })
  @IsOptional()
  @IsString()
  fontHeading?: string;

  @ApiProperty({ example: 'Inter', required: false })
  @IsOptional()
  @IsString()
  fontBody?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  heroConfig?: any;

  @ApiProperty({ example: 'default', required: false })
  @IsOptional()
  @IsString()
  themeKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customCss?: string;
}
