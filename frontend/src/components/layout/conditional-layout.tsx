'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from './header';
import { PlatformHeader } from './platform-header';
import { MobileNav } from './mobile-nav';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPlatform, setIsPlatform] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      const hostname = window.location.hostname;
      
      // Platform detection
      const platformDomains = ['stores.xxx', 'app.stores.xxx', 'market.stores.xxx', 'console.stores.xxx'];
      const isPlatformDomain = platformDomains.includes(hostname) || 
                               hostname.split('.')[0] === 'app' ||
                               port === '3000';
      
      setIsPlatform(isPlatformDomain);
    }
  }, []);
  
  // Hide header/nav on admin, staff, platform routes, and signup pages
  const isAdminPage = pathname.startsWith('/admin');
  const isStaffPage = pathname.startsWith('/staff');
  const isPlatformPage = pathname.startsWith('/platform');
  const isSignupPage = pathname.startsWith('/signup');
  
  const hideHeader = isAdminPage || isStaffPage || isPlatformPage || isSignupPage;

  return (
    <>
      {!hideHeader && (isPlatform ? <PlatformHeader /> : <Header />)}
      <main className={hideHeader ? '' : 'pb-20 md:pb-0'}>
        {children}
      </main>
      {!hideHeader && !isPlatform && <MobileNav />}
    </>
  );
}
