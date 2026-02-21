import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  label: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  line1: string;

  @ApiProperty({ example: 'Apt 4B', required: false })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'Bolton' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Greater Manchester' })
  @IsString()
  county: string;

  @ApiProperty({ example: 'BL1 1AA' })
  @IsString()
  postcode: string;

  @ApiProperty({ example: 'United Kingdom', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
