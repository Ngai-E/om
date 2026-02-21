import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetDeliverySlotsDto {
  @ApiProperty({ 
    example: 'zone-uuid', 
    description: 'Delivery zone ID',
    required: false
  })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiProperty({ 
    example: '2026-02-10', 
    description: 'Date to get slots for (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
