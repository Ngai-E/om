'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { MobileNav } from './mobile-nav';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide customer header/nav on admin, staff, platform, and signup pages
  const isAdminPage = pathname.startsWith('/admin');
  const isStaffPage = pathname.startsWith('/staff');
  const isPlatformPage = pathname.startsWith('/platform');
  const isSignupPage = pathname.startsWith('/signup');
  
  const hideCustomerLayout = isAdminPage || isStaffPage || isPlatformPage || isSignupPage;

  return (
    <>
      {!hideCustomerLayout && <Header />}
      <main className={hideCustomerLayout ? '' : 'pb-20 md:pb-0'}>
        {children}
      </main>
      {!hideCustomerLayout && <MobileNav />}
    </>
  );
}
