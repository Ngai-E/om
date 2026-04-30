import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic'; // This page uses headers() so it cannot be statically generated

function isPlatformDomain(hostname: string): boolean {
  // Platform domains (production)
  const platformDomains = [
    'stores.com',
    'stores.com',
    'app.stores.com',
    'market.stores.com',
    'console.stores.com',
  ];
  
  if (platformDomains.includes(hostname)) {
    return true;
  }
  
  // Platform subdomains.
  // NOTE: `www` is intentionally NOT here — it is the canonical prefix for
  // tenant custom domains (e.g. www.omegaafro.com) and must route to /home.
  const subdomain = hostname.split('.')[0];
  const platformSubdomains = ['app', 'market', 'console', 'platform', 'admin'];

  return platformSubdomains.includes(subdomain);
}

export default async function RootPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  // Extract hostname and port
  const [hostname, port] = host.split(':');
  
  // Development: Check port
  if (port === '3000') {
    redirect('/platform/home');
  }
  
  // Production: Check domain
  if (isPlatformDomain(hostname)) {
    redirect('/platform/home');
  }
  
  // Tenant domain - redirect to tenant home
  redirect('/home');
}
