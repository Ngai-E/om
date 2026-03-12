import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuestCheckoutDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '+447700900000' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  addressLine1: string;

  @ApiProperty({ example: 'Apt 4B', required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'London' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Greater London' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'SW1A 1AA' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'United Kingdom', default: 'United Kingdom' })
  @IsOptional()
  @IsString()
  country?: string;
}
