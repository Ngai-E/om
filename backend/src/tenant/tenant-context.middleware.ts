import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/interfaces/tenant-context.interface';

/**
 * Middleware that resolves the current tenant from the request.
 * 
 * Resolution order:
 * 1. X-Tenant-Slug header (trusted internal/dev use only)
 * 2. Subdomain from Host header ({slug}.stores.xxx)
 * 3. Custom domain lookup from tenant_domains table
 * 4. In development: Falls back to omega-afro-shop
 * 5. In production: NO FALLBACK - tenant must be resolved
 * 
 * Sets req['tenantId'] and req['tenant'] (typed TenantContext) for downstream use.
 * Rejects SUSPENDED or DISABLED tenants.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);
  
  // In-memory cache for domain → tenant mapping (TTL: 5 minutes)
  // TODO: Move to Redis for production multi-instance deployments
  private domainCache = new Map<string, { tenantId: string; tenant: any; expiresAt: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      let tenantId: string | null = null;
      let tenant: any = null;
      const host = req.headers.host || '';
      const path = req.path;

      // 0. PLATFORM DOMAINS - Skip tenant resolution entirely
      // These domains serve the platform app (landing, marketplace, onboarding, super admin)
      if (this.isPlatformDomain(host)) {
        this.logger.debug(`Platform domain detected: ${host} - skipping tenant resolution`);
        (req as any).tenant = null;
        (req as any).tenantId = null;
        next();
        return;
      }

      // 1. Check X-Tenant-Slug header (trusted for internal/dev use)
      const headerTenantSlug = req.headers['x-tenant-slug'] as string;
      if (headerTenantSlug) {
        const cached = this.getFromCache(`slug:${headerTenantSlug}`);
        if (cached) {
          tenantId = cached.tenantId;
          tenant = cached.tenant;
        } else {
          const found = await this.prisma.tenant.findUnique({
            where: { slug: headerTenantSlug },
            include: { branding: true },
          });
          if (found && !found.deletedAt) {
            tenantId = found.id;
            tenant = found;
            this.setCache(`slug:${headerTenantSlug}`, tenantId, tenant);
          }
        }
      }

      // 2. Try subdomain resolution from Host header
      if (!tenantId) {
        const slug = this.extractSubdomain(host);

        if (slug) {
          const cached = this.getFromCache(`slug:${slug}`);
          if (cached) {
            tenantId = cached.tenantId;
            tenant = cached.tenant;
          } else {
            const found = await this.prisma.tenant.findUnique({
              where: { slug },
              include: { branding: true },
            });
            if (found && !found.deletedAt) {
              tenantId = found.id;
              tenant = found;
              this.setCache(`slug:${slug}`, tenantId, tenant);
            }
          }
        }
      }

      // 3. Try full domain lookup (custom domains)
      if (!tenantId && host) {
        const cleanHost = host.split(':')[0]; // Remove port
        const cached = this.getFromCache(`domain:${cleanHost}`);
        if (cached) {
          tenantId = cached.tenantId;
          tenant = cached.tenant;
        } else {
          const tenantDomain = await this.prisma.tenantDomain.findUnique({
            where: { domain: cleanHost },
            include: {
              tenant: {
                include: { branding: true },
              },
            },
          });
          if (tenantDomain && !tenantDomain.tenant.deletedAt) {
            tenantId = tenantDomain.tenant.id;
            tenant = tenantDomain.tenant;
            this.setCache(`domain:${cleanHost}`, tenantId, tenant);
          }
        }
      }

      // 4. Development-only fallback to omegaafro
      if (!tenantId && this.isDevelopment) {
        const cached = this.getFromCache('slug:omegaafro');
        if (cached) {
          tenantId = cached.tenantId;
          tenant = cached.tenant;
        } else {
          const defaultTenant = await this.prisma.tenant.findUnique({
            where: { slug: 'omegaafro' },
            include: { branding: true },
          });
          if (defaultTenant) {
            tenantId = defaultTenant.id;
            tenant = defaultTenant;
            this.setCache('slug:omegaafro', tenantId, tenant);
            this.logger.debug(`Development fallback to tenant: ${defaultTenant.slug}`);
          }
        }
      }

      // 5. Production: No fallback - log failure
      if (!tenantId && !this.isDevelopment) {
        this.logger.warn('Tenant resolution failed in production', {
          host,
          path,
          headers: {
            'x-tenant-slug': req.headers['x-tenant-slug'],
            'user-agent': req.headers['user-agent'],
          },
        });
      }

      // 6. Check tenant status - ONLY ACTIVE tenants allowed in production
      if (tenant) {
        // In production, only ACTIVE tenants can serve requests
        if (!this.isDevelopment && tenant.status !== 'ACTIVE') {
          this.logger.warn(`Tenant not active: ${tenant.slug} (status: ${tenant.status})`, { 
            tenantId: tenant.id,
            status: tenant.status,
          });
          
          const statusMessages = {
            SUSPENDED: 'This store is currently suspended. Please contact support.',
            DISABLED: 'This store is no longer active.',
            PENDING_SETUP: 'This store is still being set up. Please complete onboarding.',
          };
          
          res.status(403).json({
            error: 'Tenant Not Available',
            message: statusMessages[tenant.status] || 'This store is not available.',
          });
          return;
        }
        
        // In development, allow PENDING_SETUP for testing, but still block SUSPENDED/DISABLED
        if (this.isDevelopment && (tenant.status === 'SUSPENDED' || tenant.status === 'DISABLED')) {
          this.logger.warn(`Tenant ${tenant.status.toLowerCase()}: ${tenant.slug}`, { tenantId: tenant.id });
          res.status(403).json({
            error: `Tenant ${tenant.status}`,
            message: tenant.status === 'SUSPENDED' 
              ? 'This store is currently suspended. Please contact support.'
              : 'This store is no longer active.',
          });
          return;
        }
      }

      // 7. Attach typed TenantContext to request
      if (tenant) {
        const tenantContext: TenantContext = {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          status: tenant.status,
          onboardingStatus: tenant.onboardingStatus,
          branding: tenant.branding ? {
            logoUrl: tenant.branding.logoUrl,
            primaryColor: tenant.branding.primaryColor,
            secondaryColor: tenant.branding.secondaryColor,
          } : undefined,
        };
        (req as any).tenant = tenantContext;
        (req as any).tenantId = tenant.id;
      } else {
        (req as any).tenant = null;
        (req as any).tenantId = null;
      }

      next();
    } catch (error) {
      this.logger.error('Tenant resolution error', {
        error: error.message,
        stack: error.stack,
        host: req.headers.host,
        path: req.path,
      });
      
      // In production, fail fast on errors
      if (!this.isDevelopment) {
        res.status(500).json({
          error: 'Tenant Resolution Error',
          message: 'Unable to resolve tenant context.',
        });
        return;
      }
      
      // In development, allow request to continue for debugging
      next();
    }
  }

  /**
   * Check if the host is a platform domain (not a tenant domain).
   * Platform domains serve: landing page, marketplace, onboarding, super admin.
   * 
   * Platform domains:
   *   - stores.xxx (root domain)
   *   - app.stores.xxx (platform admin)
   *   - market.stores.xxx (marketplace)
   *   - console.stores.xxx (super admin)
   *   - localhost:3000 (platform dev)
   * 
   * Tenant domains:
   *   - {slug}.stores.xxx (tenant storefront)
   *   - localhost:3001 (tenant dev)
   */
  private isPlatformDomain(host: string): boolean {
    const cleanHost = host.split(':')[0].toLowerCase(); // Remove port
    
    // Development: localhost on port 3000 is platform
    if (host.includes('localhost:3000') || host.includes('127.0.0.1:3000')) {
      return true;
    }
    
    // Production platform domains
    const platformDomains = [
      'stores.xxx',           // Root domain (landing page)
      'app.stores.xxx',       // Platform admin
      'market.stores.xxx',    // Marketplace
      'console.stores.xxx',   // Super admin console
    ];
    
    if (platformDomains.includes(cleanHost)) {
      return true;
    }
    
    // Check for platform subdomains
    const parts = cleanHost.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      const platformSubdomains = ['app', 'market', 'console', 'admin', 'platform'];
      if (platformSubdomains.includes(subdomain)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract subdomain slug from host.
   * Examples:
   *   "myshop.stores.xxx" → "myshop"
   *   "myshop.stores.xxx:3000" → "myshop"
   *   "localhost:3001" → null
   *   "stores.xxx" → null
   */
  private extractSubdomain(host: string): string | null {
    const cleanHost = host.split(':')[0]; // Remove port
    const parts = cleanHost.split('.');

    // Need at least 3 parts for subdomain: slug.stores.xxx
    if (parts.length >= 3) {
      const slug = parts[0];
      // Skip common non-tenant subdomains
      const reserved = ['www', 'api', 'admin', 'console', 'market', 'partners'];
      if (!reserved.includes(slug)) {
        return slug;
      }
    }

    return null;
  }

  private getFromCache(key: string) {
    const entry = this.domainCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry;
    }
    if (entry) {
      this.domainCache.delete(key);
    }
    return null;
  }

  private setCache(key: string, tenantId: string, tenant: any) {
    this.domainCache.set(key, {
      tenantId,
      tenant,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }
}
