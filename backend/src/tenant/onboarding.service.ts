import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SettingsService } from '../settings/settings.service';
import { TenantSignupDto } from './dto/tenant-signup.dto';
import * as bcrypt from 'bcrypt';

const DEFAULT_SUBDOMAIN_SUFFIX = 'stores.com';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private settingsService: SettingsService,
  ) {}

  async signup(dto: TenantSignupDto) {
    // Validate slug against reserved list
    const reservedSlugs = ['admin', 'api', 'app', 'market', 'platform', 'support', 'mail', 'www', 'assets'];
    if (reservedSlugs.includes(dto.slug.toLowerCase())) {
      throw new BadRequestException('This slug is reserved and cannot be used');
    }

    // Check slug uniqueness
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existingTenant) {
      throw new ConflictException('Store slug is already taken');
    }

    // Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      // 1. Get default starter plan
      const starterPlan = await tx.plan.findFirst({
        where: { code: 'starter', isActive: true },
      });

      if (!starterPlan) {
        throw new BadRequestException('Default starter plan not found. Please contact support.');
      }

      const trialDays = starterPlan.trialDays || 14;
      const trialStartsAt = new Date();
      const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

      // 2. Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.storeName,
          slug: dto.slug,
          email: dto.email,
          phone: dto.phone,
          description: dto.description,
          status: 'PENDING_SETUP',
          onboardingStatus: 'PENDING',
          billingStatus: 'TRIAL',
          trialStartsAt,
          trialEndsAt,
        },
      });

      // 3. Create subscription to starter plan
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: starterPlan.id,
          status: 'TRIALING',
          trialStartsAt,
          trialEndsAt,
          currentPeriodStartsAt: trialStartsAt,
          currentPeriodEndsAt: trialEndsAt,
        },
      });

      // 4. Create onboarding tracking record
      await tx.tenantOnboarding.create({
        data: {
          tenantId: tenant.id,
          selectedPlanCode: starterPlan.code,
          contactEmail: dto.email,
          contactPhone: dto.phone,
          currentStep: 'branding',
          completedBranding: false,
          completedDomain: false,
          completedCatalog: false,
          completedPayments: false,
        },
      });

      // 5. Create default branding with hero config from signup data
      await tx.tenantBranding.create({
        data: {
          tenantId: tenant.id,
          primaryColor: '#036637',
          secondaryColor: '#FF7730',
          themeKey: 'default',
          heroConfig: {
            heading: dto.storeName,
            subheading: dto.description || 'Quality products. Great prices. Fast delivery.',
            imageUrl: null,
            trustBadges: [
              'Same-day home delivery',
              'Fast & easy ordering',
              '1000+ happy customers',
            ],
          },
        },
      });

      // 6. Create subdomain
      const subdomainSuffix = await this.getSubdomainSuffix();
      await tx.tenantDomain.create({
        data: {
          tenantId: tenant.id,
          domain: `${dto.slug}.${subdomainSuffix}`,
          type: 'SUBDOMAIN',
          isPrimary: true,
          sslStatus: 'PENDING',
          verificationStatus: 'VERIFIED',
        },
      });

      // 7. Create admin user for this tenant
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: 'ADMIN',
          tenantId: tenant.id,
          emailVerified: false,
          isActive: true,
        },
      });

      // 8. Generate JWT
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
      });

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          billingStatus: tenant.billingStatus,
          trialEndsAt: tenant.trialEndsAt,
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantSlug: tenant.slug,
        },
        accessToken,
        storefrontUrl: `https://${dto.slug}.${await this.getSubdomainSuffix()}`,
        adminUrl: `https://${dto.slug}.${await this.getSubdomainSuffix()}/admin`,
      };
    });
  }

  private async getSubdomainSuffix(): Promise<string> {
    const suffix = await this.settingsService.getPlatformSetting('platform_subdomain_suffix');
    return suffix || DEFAULT_SUBDOMAIN_SUFFIX;
  }

  async checkSlugAvailability(slug: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    return { available: !existing };
  }
}
