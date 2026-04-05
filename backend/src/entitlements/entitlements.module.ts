import { Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { UsageService } from './usage.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EntitlementsService, UsageService],
  exports: [EntitlementsService, UsageService],
})
export class EntitlementsModule {}
