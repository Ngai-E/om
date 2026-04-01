import { Global, Module } from '@nestjs/common';
import { LicensingController } from './licensing.controller';
import { LicensingService } from './licensing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureGateGuard, LimitGateGuard } from '../auth/guards/feature-gate.guard';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [LicensingController],
  providers: [LicensingService, FeatureGateGuard, LimitGateGuard],
  exports: [LicensingService, FeatureGateGuard, LimitGateGuard],
})
export class LicensingModule {}
