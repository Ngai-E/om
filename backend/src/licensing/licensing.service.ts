import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto, UpdatePackageDto, CreateLicenseDto, UpdateLicenseDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class LicensingService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // PACKAGE MANAGEMENT
  // ============================================

  async createPackage(dto: CreatePackageDto) {
    const existing = await this.prisma.package.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Package name already exists');
    }

    return this.prisma.package.create({
      data: {
        name: dto.name,
        tier: dto.tier as any,
        displayName: dto.displayName,
        description: dto.description,
        price: dto.price,
        billingCycle: dto.billingCycle,
        maxOrders: dto.maxOrders,
        maxUsers: dto.maxUsers,
        maxProducts: dto.maxProducts,
        features: dto.features,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async getAllPackages(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    
    return this.prisma.package.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { tier: 'asc' }],
      include: {
        _count: {
          select: { licenses: true },
        },
      },
    });
  }

  async getPackage(id: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: {
        licenses: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            companyName: true,
            status: true,
            issuedAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    return pkg;
  }

  async updatePackage(id: string, dto: UpdatePackageDto) {
    await this.getPackage(id);

    return this.prisma.package.update({
      where: { id },
      data: {
        ...dto,
        tier: dto.tier as any,
      },
    });
  }

  async deletePackage(id: string) {
    const pkg = await this.getPackage(id);

    const activeLicenses = await this.prisma.license.count({
      where: { packageId: id, status: 'ACTIVE' },
    });

    if (activeLicenses > 0) {
      throw new BadRequestException(
        `Cannot delete package with ${activeLicenses} active licenses`,
      );
    }

    return this.prisma.package.delete({ where: { id } });
  }

  // ============================================
  // LICENSE MANAGEMENT
  // ============================================

  generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const segment = crypto.randomBytes(4).toString('hex').toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  }

  async createLicense(dto: CreateLicenseDto, issuedBy: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id: dto.packageId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const licenseKey = this.generateLicenseKey();

    return this.prisma.license.create({
      data: {
        licenseKey,
        packageId: dto.packageId,
        companyName: dto.companyName,
        contactEmail: dto.contactEmail,
        contactName: dto.contactName,
        domain: dto.domain,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        notes: dto.notes,
        issuedBy,
      },
      include: {
        package: true,
      },
    });
  }

  async getAllLicenses(filters?: { status?: string; packageId?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.packageId) {
      where.packageId = filters.packageId;
    }

    return this.prisma.license.findMany({
      where,
      include: {
        package: {
          select: {
            id: true,
            name: true,
            displayName: true,
            tier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLicense(id: string) {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: {
        package: true,
        usageLogs: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
      },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    return license;
  }

  async getLicenseByKey(licenseKey: string) {
    const license = await this.prisma.license.findUnique({
      where: { licenseKey },
      include: {
        package: true,
      },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    return license;
  }

  async validateLicense(licenseKey: string, domain?: string) {
    const license = await this.getLicenseByKey(licenseKey);

    // Check status
    if (license.status !== 'ACTIVE') {
      return {
        valid: false,
        reason: `License is ${license.status.toLowerCase()}`,
        license: null,
      };
    }

    // Check expiration
    if (license.expiresAt && new Date() > license.expiresAt) {
      // Auto-expire
      await this.prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      });

      return {
        valid: false,
        reason: 'License has expired',
        license: null,
      };
    }

    // Check domain restriction
    if (license.domain && domain && license.domain !== domain) {
      return {
        valid: false,
        reason: 'Domain mismatch',
        license: null,
      };
    }

    // Update last validated timestamp
    await this.prisma.license.update({
      where: { id: license.id },
      data: { lastValidatedAt: new Date() },
    });

    return {
      valid: true,
      reason: null,
      license,
    };
  }

  async updateLicense(id: string, dto: UpdateLicenseDto) {
    await this.getLicense(id);

    return this.prisma.license.update({
      where: { id },
      data: {
        status: dto.status as any,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        notes: dto.notes,
      },
      include: {
        package: true,
      },
    });
  }

  async revokeLicense(id: string) {
    return this.updateLicense(id, { status: 'REVOKED' });
  }

  async activateLicense(licenseKey: string) {
    const license = await this.getLicenseByKey(licenseKey);

    if (license.status !== 'ACTIVE') {
      await this.prisma.license.update({
        where: { id: license.id },
        data: {
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
      });
    }

    return this.getLicense(license.id);
  }

  // ============================================
  // USAGE TRACKING
  // ============================================

  async trackUsage(licenseId: string, metric: string, value: number, metadata?: any) {
    return this.prisma.licenseUsageLog.create({
      data: {
        licenseId,
        metric,
        value,
        metadata,
      },
    });
  }

  async updateUsageMetrics(licenseId: string, metrics: {
    orders?: number;
    users?: number;
    products?: number;
  }) {
    return this.prisma.license.update({
      where: { id: licenseId },
      data: {
        currentOrders: metrics.orders,
        currentUsers: metrics.users,
        currentProducts: metrics.products,
      },
    });
  }

  async checkUsageLimits(licenseKey: string) {
    const license = await this.getLicenseByKey(licenseKey);
    const pkg = license.package;

    const warnings = [];

    if (pkg.maxOrders && license.currentOrders >= pkg.maxOrders) {
      warnings.push(`Order limit reached: ${license.currentOrders}/${pkg.maxOrders}`);
    }

    if (pkg.maxUsers && license.currentUsers >= pkg.maxUsers) {
      warnings.push(`User limit reached: ${license.currentUsers}/${pkg.maxUsers}`);
    }

    if (pkg.maxProducts && license.currentProducts >= pkg.maxProducts) {
      warnings.push(`Product limit reached: ${license.currentProducts}/${pkg.maxProducts}`);
    }

    return {
      withinLimits: warnings.length === 0,
      warnings,
      usage: {
        orders: { current: license.currentOrders, max: pkg.maxOrders },
        users: { current: license.currentUsers, max: pkg.maxUsers },
        products: { current: license.currentProducts, max: pkg.maxProducts },
      },
    };
  }

  // ============================================
  // FEATURE FLAGS
  // ============================================

  async hasFeature(licenseKey: string, featureKey: string): Promise<boolean> {
    const license = await this.getLicenseByKey(licenseKey);
    const features = license.package.features as Record<string, boolean>;
    return features[featureKey] === true;
  }

  async getFeatures(licenseKey: string) {
    const license = await this.getLicenseByKey(licenseKey);
    return license.package.features;
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStatistics() {
    const [
      totalPackages,
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      revenueByPackage,
    ] = await Promise.all([
      this.prisma.package.count(),
      this.prisma.license.count(),
      this.prisma.license.count({ where: { status: 'ACTIVE' } }),
      this.prisma.license.count({ where: { status: 'EXPIRED' } }),
      this.prisma.license.groupBy({
        by: ['packageId'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
    ]);

    return {
      totalPackages,
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      suspendedLicenses: await this.prisma.license.count({ where: { status: 'SUSPENDED' } }),
      revokedLicenses: await this.prisma.license.count({ where: { status: 'REVOKED' } }),
      revenueByPackage,
    };
  }
}
