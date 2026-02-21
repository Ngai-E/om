import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum InventoryAction {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  SET = 'SET',
}

export class UpdateInventoryDto {
  @ApiProperty({ enum: InventoryAction, example: 'ADD' })
  @IsEnum(InventoryAction)
  action: InventoryAction;

  @ApiProperty({ example: 50 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'Restocked from supplier', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
