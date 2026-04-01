import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TenantController, StorefrontTenantController } from './tenant.controller';
import { OnboardingController } from './onboarding.controller';
import { TenantService } from './tenant.service';
import { OnboardingService } from './onboarding.service';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [TenantController, StorefrontTenantController, OnboardingController],
  providers: [TenantService, OnboardingService, TenantContextMiddleware],
  exports: [TenantService, TenantContextMiddleware],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant resolution middleware to all routes
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
