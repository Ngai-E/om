import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateMarketplaceOfferDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  estimatedEta?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
