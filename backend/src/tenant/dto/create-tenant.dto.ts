import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'My African Store' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'my-african-store' })
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({ example: 'owner@mystore.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+44 7535 316253', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Authentic African & Caribbean groceries', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
