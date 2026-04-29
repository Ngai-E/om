/**
 * Tenant resolution utility for frontend.
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_TENANT_SLUG env var (for local dev override)
 * 2. Subdomain from current hostname ({slug}.stores.xxx)
 * 3. Falls back to 'omega-afro-shop'
 *
 * The resolved slug is sent as X-Tenant-Slug header to the backend,
 * where TenantContextMiddleware resolves it to a full tenant object.
 */

const DEFAULT_TENANT_SLUG = 'omega-afro-shop';

/**
 * Known platform subdomains that are NOT tenant slugs.
 */
const PLATFORM_SUBDOMAINS = new Set(['market', 'console', 'api', 'www', 'app']);

/**
 * Extract tenant slug from a hostname.
 * Expected format: {slug}.stores.xxx or {slug}.localhost
 */
function extractSlugFromHost(host: string): string | null {
  const cleanHost = host.split(':')[0]; // Remove port
  const parts = cleanHost.split('.');

  // Need at least 3 parts for subdomain (slug.stores.xxx)
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
