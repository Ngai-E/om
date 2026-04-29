import { headers } from 'next/headers';

const DEFAULT_TENANT_SLUG = 'omegaafro';
const PLATFORM_SUBDOMAINS = new Set(['market', 'console', 'api', 'www', 'app']);

/**
 * Extract tenant slug from a hostname on the server.
 */
function extractSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  
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
 * Get the current tenant slug for Server Components.
 */
export async function getServerTenantSlug(): Promise<string> {
  // 1. Env var override (useful for local dev)
  const envSlug = process.env.NEXT_PUBLIC_TENANT_SLUG;
  if (envSlug) return envSlug;

  // 2. Extract from Host header
  const headersList = await headers();
  const host = headersList.get('host');
  const slug = extractSlugFromHost(host);
  
  if (slug) return slug;

  // 3. Fallback
  return DEFAULT_TENANT_SLUG;
}
