/**
 * Tenant resolution utility for frontend.
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_TENANT_SLUG env var (for local dev override)
 * 2. Subdomain from current hostname ({slug}.stores.com)
 * 3. Falls back to 'omegaafro'
 *
 * The resolved slug is sent as X-Tenant-Slug header to the backend,
 * where TenantContextMiddleware resolves it to a full tenant object.
 */

const DEFAULT_TENANT_SLUG = 'omegaafro';

/**
 * Known platform subdomains that are NOT tenant slugs.
 */
// Subdomain labels that are NEVER a tenant slug. `www` is included here:
// there is no tenant named "www"; it is a cosmetic prefix on custom domains
// (e.g. www.omegaafro.com). Requests on those hosts must fall back to
// NEXT_PUBLIC_TENANT_SLUG or the default tenant, not send "www" as the slug.
const PLATFORM_SUBDOMAINS = new Set(['market', 'console', 'api', 'app', 'admin', 'platform', 'www']);

/**
 * Extract tenant slug from a hostname.
 * Expected format: {slug}.stores.com or {slug}.localhost
 */
function extractSlugFromHost(host: string): string | null {
  const cleanHost = host.split(':')[0]; // Remove port
  const parts = cleanHost.split('.');

  // Need at least 3 parts for subdomain (slug.stores.com)
  // or 2 parts for local dev (slug.localhost)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (!PLATFORM_SUBDOMAINS.has(subdomain)) {
      return subdomain;
    }
  } else if (parts.length === 2 && parts[1] === 'localhost') {
    const subdomain = parts[0];
    if (!PLATFORM_SUBDOMAINS.has(subdomain)) {
      return subdomain;
    }
  }

  // Custom-domain fallback: derive the slug from the apex label.
  //   www.omegaafro.com  → 'omegaafro'
  //   omegaafro.com      → 'omegaafro'
  // Requires tenants to have a slug that matches the apex label of their
  // custom domain (enforce this at onboarding time).
  if (parts.length >= 2) {
    const apexLabel = parts[parts[0] === 'www' ? 1 : 0];
    if (apexLabel && !PLATFORM_SUBDOMAINS.has(apexLabel)) {
      return apexLabel;
    }
  }

  return null;
}

/**
 * Get the current tenant slug. Safe to call on both server and client.
 *
 * Resolution order:
 * 1. Env var override (local dev)
 * 2. Subdomain from hostname
 * 3. Logged-in user's tenantSlug (from persisted auth store)
 * 4. Fallback to default tenant
 */
export function getTenantSlug(): string {
  // 1. Env var override (useful for local dev)
  const envSlug = process.env.NEXT_PUBLIC_TENANT_SLUG;
  if (envSlug) return envSlug;

  // 2. Extract from browser hostname (subdomain takes priority)
  if (typeof window !== 'undefined') {
    const slug = extractSlugFromHost(window.location.host);
    if (slug) return slug;

    // 3. Check logged-in user's tenant from persisted auth store
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        const tenantSlug = parsed?.state?.user?.tenantSlug;
        if (tenantSlug) return tenantSlug;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // 4. Fallback
  return DEFAULT_TENANT_SLUG;
}

/**
 * Get tenant headers to include in API requests.
 */
export function getTenantHeaders(): Record<string, string> {
  return {
    'X-Tenant-Slug': getTenantSlug(),
  };
}

/**
 * Tenant-aware fetch wrapper. Adds X-Tenant-Slug header automatically.
 * Drop-in replacement for native fetch().
 */
export function tenantFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('X-Tenant-Slug') && !headers.has('X-Tenant-ID')) {
    headers.set('X-Tenant-Slug', getTenantSlug());
  }
  return fetch(input, { ...init, headers });
}
