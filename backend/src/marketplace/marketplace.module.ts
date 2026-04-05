import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceProviderController } from './marketplace-provider.controller';
import { MarketplaceProviderService } from './services/marketplace-provider.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    MarketplaceController,
    MarketplaceProviderController,
  ],
  providers: [
    MarketplaceService,
    MarketplaceProviderService,
  ],
  exports: [
    MarketplaceService,
    MarketplaceProviderService,
  ],
})
export class MarketplaceModule {}
