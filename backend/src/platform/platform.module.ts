import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { WebhookController } from './webhook.controller';
import { TenantPayoutsController } from './tenant-payouts.controller';
import { PlatformService } from './platform.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformController, WebhookController, TenantPayoutsController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
