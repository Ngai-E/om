import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Middleware that resolves the current tenant from the request.
 * 
 * Resolution order:
 * 1. X-Tenant-ID header (for API calls / dev)
 * 2. Subdomain from Host header ({slug}.stores.xxx)
 * 3. Custom domain lookup from tenant_domains table
 * 4. Falls back to default tenant (omega-afro-shop) if none found
 * 
 * Sets req['tenantId'] and req['tenant'] for downstream use.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  // In-memory cache for domain → tenant mapping (TTL: 5 minutes)
  private domainCache = new Map<string, { tenantId: string; tenant: any; expiresAt: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      let tenantId: string | null = null;
      let tenant: any = null;

      // 1a. Check X-Tenant-ID header (UUID — useful for API integrations)
      const headerTenantId = req.headers['x-tenant-id'] as string;
      if (headerTenantId) {
        const cached = this.getFromCache(`id:${headerTenantId}`);
        if (cached) {
          tenantId = cached.tenantId;
          tenant = cached.tenant;
        } else {
          const found = await this.prisma.tenant.findUnique({
            where: { id: headerTenantId },
            include: { branding: true },
          });
          if (found && !found.deletedAt) {
            tenantId = found.id;
            tenant = found;
            this.setCache(`id:${headerTenantId}`, tenantId, tenant);
          }
        }
      }

      // 1b. Check X-Tenant-Slug header (slug — useful for frontend/dev)
      if (!tenantId) {
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
      }

      // 2. Try subdomain resolution from Host header
      if (!tenantId) {
        const host = req.headers.host || '';
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
      }

      // 4. Fallback: resolve default tenant (omega-afro-shop)
      if (!tenantId) {
        const cached = this.getFromCache('slug:omega-afro-shop');
        if (cached) {
          tenantId = cached.tenantId;
          tenant = cached.tenant;
        } else {
          const defaultTenant = await this.prisma.tenant.findUnique({
            where: { slug: 'omega-afro-shop' },
            include: { branding: true },
          });
          if (defaultTenant) {
            tenantId = defaultTenant.id;
            tenant = defaultTenant;
            this.setCache('slug:omega-afro-shop', tenantId, tenant);
          }
        }
      }

      // Attach to request
      (req as any).tenantId = tenantId;
      (req as any).tenant = tenant;

      next();
    } catch (error) {
      // Don't block requests on tenant resolution failure
      console.error('Tenant resolution error:', error);
      next();
    }
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
