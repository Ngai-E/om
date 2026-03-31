import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TenantController, StorefrontTenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController, StorefrontTenantController],
  providers: [TenantService, TenantContextMiddleware],
  exports: [TenantService, TenantContextMiddleware],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant resolution middleware to all routes
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
