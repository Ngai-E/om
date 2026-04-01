import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto, UpdateBrandingDto } from './dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // TENANT CRUD
  // ============================================

  async create(dto: CreateTenantDto) {
    // Check slug uniqueness
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('A store with this slug already exists');
    }

    // Create tenant + default branding + subdomain in a transaction
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          email: dto.email,
          phone: dto.phone,
          description: dto.description,
          status: 'ACTIVE',
          billingStatus: 'TRIAL',
          trialStartsAt: new Date(),
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        },
      });

      // Create default branding
      await tx.tenantBranding.create({
        data: {
          tenantId: tenant.id,
          primaryColor: '#036637',
          secondaryColor: '#FF7730',
          themeKey: 'default',
        },
      });

      // Create subdomain
      await tx.tenantDomain.create({
        data: {
          tenantId: tenant.id,
          domain: `${dto.slug}.stores.xxx`,
          type: 'SUBDOMAIN',
          isPrimary: true,
          sslStatus: 'active',
          verificationStatus: 'verified',
        },
      });

      // Return full tenant with includes (must use tx, not this.prisma)
      return tx.tenant.findUnique({
        where: { id: tenant.id },
        include: {
          branding: true,
          domains: true,
          _count: {
            select: {
              users: true,
              products: true,
              orders: true,
              categories: true,
              promotions: true,
            },
          },
        },
      });
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        include: {
          branding: true,
          domains: true,
          _count: {
            select: {
              users: true,
              products: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: tenants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        branding: true,
        domains: true,
        licenses: {
          include: { package: true },
          where: { status: 'ACTIVE' },
          take: 1,
        },
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
            categories: true,
            promotions: true,
          },
        },
      },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        branding: true,
        domains: true,
      },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Store not found');
    }

    return tenant;
  }

  async findByDomain(domain: string) {
    const tenantDomain = await this.prisma.tenantDomain.findUnique({
      where: { domain },
      include: {
        tenant: {
          include: {
            branding: true,
          },
        },
      },
    });

    if (!tenantDomain || tenantDomain.tenant.deletedAt) {
      return null;
    }

    return tenantDomain.tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findById(id); // Ensure exists

    // If slug is being changed, check uniqueness
    if (dto.slug) {
      const existing = await this.prisma.tenant.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('A store with this slug already exists');
      }
    }

    await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.email && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.billingStatus && { billingStatus: dto.billingStatus as any }),
      },
    });

    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id); // Ensure exists

    // Soft delete
    await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });

    return { message: 'Tenant deleted successfully' };
  }

  // ============================================
  // BRANDING
  // ============================================

  async getBranding(tenantId: string) {
    const branding = await this.prisma.tenantBranding.findUnique({
      where: { tenantId },
    });

    if (!branding) {
      throw new NotFoundException('Branding not found for this tenant');
    }

    return branding;
  }

  async updateBranding(tenantId: string, dto: UpdateBrandingDto) {
    await this.findById(tenantId); // Ensure tenant exists

    return this.prisma.tenantBranding.upsert({
      where: { tenantId },
      update: {
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.faviconUrl !== undefined && { faviconUrl: dto.faviconUrl }),
        ...(dto.primaryColor && { primaryColor: dto.primaryColor }),
        ...(dto.secondaryColor && { secondaryColor: dto.secondaryColor }),
        ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
        ...(dto.fontHeading && { fontHeading: dto.fontHeading }),
        ...(dto.fontBody && { fontBody: dto.fontBody }),
        ...(dto.heroConfig !== undefined && { heroConfig: dto.heroConfig }),
        ...(dto.themeKey && { themeKey: dto.themeKey }),
        ...(dto.customCss !== undefined && { customCss: dto.customCss }),
      },
      create: {
        tenantId,
        ...dto,
      },
    });
  }

  // ============================================
  // DOMAINS
  // ============================================

  async getDomains(tenantId: string) {
    await this.findById(tenantId);
    return this.prisma.tenantDomain.findMany({
      where: { tenantId },
      orderBy: { isPrimary: 'desc' },
    });
  }

  async addDomain(tenantId: string, domain: string, type: 'SUBDOMAIN' | 'CUSTOM' = 'CUSTOM') {
    await this.findById(tenantId);

    const existing = await this.prisma.tenantDomain.findUnique({
      where: { domain },
    });

    if (existing) {
      throw new ConflictException('This domain is already in use');
    }

    return this.prisma.tenantDomain.create({
      data: {
        tenantId,
        domain,
        type,
        sslStatus: type === 'CUSTOM' ? 'pending' : 'active',
        verificationStatus: type === 'CUSTOM' ? 'pending' : 'verified',
        verificationToken: type === 'CUSTOM' ? this.generateVerificationToken() : null,
      },
    });
  }

  async removeDomain(tenantId: string, domainId: string) {
    const domain = await this.prisma.tenantDomain.findFirst({
      where: { id: domainId, tenantId },
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    if (domain.isPrimary) {
      throw new BadRequestException('Cannot remove the primary domain');
    }

    await this.prisma.tenantDomain.delete({ where: { id: domainId } });
    return { message: 'Domain removed successfully' };
  }

  // ============================================
  // STATS (for super admin)
  // ============================================

  async getPlatformStats() {
    const [totalTenants, activeTenants, trialTenants, totalOrders, totalProducts] =
      await Promise.all([
        this.prisma.tenant.count({ where: { deletedAt: null } }),
        this.prisma.tenant.count({ where: { status: 'ACTIVE', deletedAt: null } }),
        this.prisma.tenant.count({ where: { billingStatus: 'TRIAL', deletedAt: null } }),
        this.prisma.order.count(),
        this.prisma.product.count({ where: { deletedAt: null } }),
      ]);

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      totalOrders,
      totalProducts,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateVerificationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'stores-verify-';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
