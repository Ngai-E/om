import { Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { UsageService } from './usage.service';
import { EntitlementsController, UsageController } from './entitlements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EntitlementsController, UsageController],
  providers: [EntitlementsService, UsageService],
  exports: [EntitlementsService, UsageService],
})
export class EntitlementsModule {}
