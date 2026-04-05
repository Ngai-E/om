import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

function isPlatformDomain(hostname: string): boolean {
  // Platform domains (production)
  const platformDomains = [
    'stores.xxx',
    'app.stores.xxx',
    'market.stores.xxx',
    'console.stores.xxx',
  ];
  
  if (platformDomains.includes(hostname)) {
    return true;
  }
  
  // Platform subdomains
  const subdomain = hostname.split('.')[0];
  const platformSubdomains = ['app', 'market', 'console', 'platform', 'www'];
  
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
