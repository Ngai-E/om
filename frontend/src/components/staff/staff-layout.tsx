'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Phone, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

interface StaffLayoutProps {
  children: ReactNode;
}

export function StaffLayout({ children }: StaffLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const navItems = [
    {
      label: 'Orders',
      icon: Package,
      href: '/staff/orders',
      active: pathname?.startsWith('/staff/orders'),
    },
    {
      label: 'Phone Orders',
      icon: Phone,
      href: '/staff/phone-order',
      active: pathname === '/staff/phone-order',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Minimal Sidebar - Only 4 items */}
      <aside className="w-64 bg-white border-r flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b">
          <Link href="/staff/dashboard">
            <h1 className="text-2xl font-bold text-green-600">Staff Portal</h1>
          </Link>
        </div>

        {/* Navigation - MINIMAL */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition ${
                  item.active
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
