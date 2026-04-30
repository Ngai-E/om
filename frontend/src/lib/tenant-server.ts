import { headers } from 'next/headers';

const DEFAULT_TENANT_SLUG = 'omegaafro';
// Subdomain labels that are NEVER a tenant slug. `www` is included here:
// there is no tenant named "www"; it is a cosmetic prefix on custom domains
// (e.g. www.omegaafro.com). Requests on those hosts must fall back to
// NEXT_PUBLIC_TENANT_SLUG or the default tenant, not send "www" as the slug.
const PLATFORM_SUBDOMAINS = new Set(['market', 'console', 'api', 'app', 'admin', 'platform', 'www']);

/**
 * Extract tenant slug from a hostname on the server.
 */
function extractSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  
  const cleanHost = host.split(':')[0]; // Remove port
  const parts = cleanHost.split('.');

  // Need at least 3 parts for subdomain (slug.viralsocialmediabooster.com)
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
