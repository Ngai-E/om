'use client';

import React from 'react';
import { MapPin, Bell, User, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/platform');
  };

  // Check if user has provider profile (tenant owner or admin)
  const isProvider = user && user.tenantId;
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
  const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/platform">
            <h1 className="text-primary cursor-pointer font-bold text-xl">Platform</h1>
          </Link>
          <Link
            href="/marketplace"
            className={`hidden md:flex items-center gap-2 ${
              pathname === '/marketplace' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Marketplace</span>
          </Link>
          {isProvider && (
            <Link
              href="/marketplace/provider"
              className={`hidden md:flex items-center gap-2 ${
                pathname === '/marketplace/provider' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Provider Dashboard</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className={`hidden md:flex items-center gap-2 ${
                pathname?.startsWith('/admin') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground md:hidden">
            <MapPin className="h-5 w-5" />
            <span className="text-sm">Location</span>
          </button>
          {isAuthenticated && (
            <button className="p-2 hover:bg-muted rounded-lg">
              <Bell className="h-5 w-5" />
            </button>
          )}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden md:block text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
              <button
                onClick={() => router.push('/onboarding')}
                className="hidden md:block bg-accent text-accent-foreground px-4 py-2 rounded-lg hover:bg-accent/90 font-medium"
              >
                Launch store
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
