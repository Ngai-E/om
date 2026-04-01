import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SettingsService } from '../settings/settings.service';
import { TenantSignupDto } from './dto/tenant-signup.dto';
import * as bcrypt from 'bcrypt';

const DEFAULT_SUBDOMAIN_SUFFIX = 'stores.xxx';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private settingsService: SettingsService,
  ) {}

  async signup(dto: TenantSignupDto) {
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
      // 1. Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.storeName,
          slug: dto.slug,
          email: dto.email,
          phone: dto.phone,
          description: dto.description,
          status: 'ACTIVE',
          billingStatus: 'TRIAL',
          trialStartsAt: new Date(),
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      // 2. Create default branding
      await tx.tenantBranding.create({
        data: {
          tenantId: tenant.id,
          primaryColor: '#036637',
          secondaryColor: '#FF7730',
          themeKey: 'default',
        },
      });

      // 3. Create subdomain
      const subdomainSuffix = await this.getSubdomainSuffix();
      await tx.tenantDomain.create({
        data: {
          tenantId: tenant.id,
          domain: `${dto.slug}.${subdomainSuffix}`,
          type: 'SUBDOMAIN',
          isPrimary: true,
          sslStatus: 'active',
          verificationStatus: 'verified',
        },
      });

      // 4. Create admin user for this tenant
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

      // 5. Generate JWT
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
