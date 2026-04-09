'use client';

import React from 'react';
import { Home, Search, PlusCircle, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const isProvider = user && user.tenantId;
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

  // Build nav items based on authentication and role
  const allNavItems = [
    { id: 'home', icon: Home, label: 'Home', href: '/platform', requiresAuth: false },
    { id: 'browse', icon: Search, label: 'Browse', href: '/marketplace', requiresAuth: false },
    { id: 'post', icon: PlusCircle, label: 'Post', href: '/marketplace/post-request', requiresAuth: true },
    { id: 'provider', icon: User, label: 'Provider', href: '/marketplace/provider', requiresAuth: true, requiresProvider: true },
    { id: 'more', icon: Menu, label: 'More', href: isAdmin ? '/admin' : '/account', requiresAuth: false },
  ];

  // Filter nav items based on authentication and role
  const navItems = allNavItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.requiresProvider && !isProvider) return false;
    return true;
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/admin' && pathname?.startsWith('/admin'));
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 px-4 flex-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
