import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckPostcodeDto {
  @ApiProperty({ 
    example: 'BL1 1AA', 
    description: 'UK postcode to check delivery availability' 
  })
  @IsString()
  @Matches(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, {
    message: 'Invalid UK postcode format',
  })
  postcode: string;
}
