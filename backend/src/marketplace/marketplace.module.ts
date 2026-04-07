import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceProviderController } from './marketplace-provider.controller';
import { MarketplaceRequestController } from './marketplace-request.controller';
import { MarketplaceOfferController } from './marketplace-offer.controller';
import { MarketplaceMatchController } from './marketplace-match.controller';
import { MarketplaceAdminController } from './marketplace-admin.controller';
import { MarketplaceProviderService } from './services/marketplace-provider.service';
import { MarketplaceRequestService } from './services/marketplace-request.service';
import { MarketplaceMatchingService } from './services/marketplace-matching.service';
import { MarketplaceOfferService } from './services/marketplace-offer.service';
import { MarketplaceModerationService } from './services/marketplace-moderation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    MarketplaceController,
    MarketplaceProviderController,
    MarketplaceRequestController,
    MarketplaceOfferController,
    MarketplaceMatchController,
    MarketplaceAdminController,
  ],
  providers: [
    MarketplaceService,
    MarketplaceProviderService,
    MarketplaceRequestService,
    MarketplaceMatchingService,
    MarketplaceOfferService,
    MarketplaceModerationService,
  ],
  exports: [
    MarketplaceService,
    MarketplaceProviderService,
    MarketplaceRequestService,
    MarketplaceMatchingService,
    MarketplaceOfferService,
    MarketplaceModerationService,
  ],
})
export class MarketplaceModule {}
