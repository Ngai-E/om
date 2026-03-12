import { IsString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum StaffRole {
  STAFF = 'STAFF',
  PICKER = 'PICKER',
  DRIVER = 'DRIVER',
}

export class CreateStaffDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+447700900000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: StaffRole, example: StaffRole.STAFF })
  @IsEnum(StaffRole)
  role: StaffRole;
}
