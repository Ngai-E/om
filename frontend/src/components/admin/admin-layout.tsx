'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Package, 
  Phone, 
  ShoppingBag, 
  BarChart3, 
  Truck, 
  Users, 
  UserCog,
  Tag, 
  Settings, 
  Shield, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  Star,
  FolderTree,
  Video
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [globalSearch, setGlobalSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      // Navigate to orders page with search query
      router.push(`/admin/orders?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  // Fetch badge counts from API
  const { data: badgeCounts } = useQuery({
    queryKey: ['admin-badge-counts'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/admin/badge-counts');
        return data;
      } catch (error) {
        // Return defaults if API fails
        return { pendingOrders: 0, lowStockItems: 0 };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Navigation items with dynamic counts
  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/admin',
    },
    { 
      icon: Package, 
      label: 'Orders', 
      href: '/admin/orders',
      badge: badgeCounts?.pendingOrders || undefined,
      subItems: [
        { label: 'All Orders', href: '/admin/orders' },
        { label: 'Pending Payment', href: '/admin/orders?status=pending', badge: badgeCounts?.pendingOrders || undefined },
        { label: 'Today', href: '/admin/orders?date=today' },
      ]
    },
    { 
      icon: Phone, 
      label: 'Phone Orders', 
      href: '/staff/phone-order',
    },
    { 
      icon: ShoppingBag, 
      label: 'Products', 
      href: '/admin/products',
    },
    { 
      icon: FolderTree, 
      label: 'Categories', 
      href: '/admin/categories',
    },
    { 
      icon: BarChart3, 
      label: 'Inventory', 
      href: '/admin/inventory',
      badge: badgeCounts?.lowStockItems || undefined,
      badgeColor: 'bg-orange-500'
    },
    { 
      icon: Truck, 
      label: 'Delivery', 
      href: '/admin/delivery',
    },
    { 
      icon: Users, 
      label: 'Customers', 
      href: '/admin/users',
    },
    { 
      icon: UserCog, 
      label: 'Staff', 
      href: '/admin/staff',
      adminOnly: true
    },
    { 
      icon: Shield, 
      label: 'Staff Permissions', 
      href: '/admin/staff-permissions',
      adminOnly: true
    },
    { 
      icon: Tag, 
      label: 'Promotions', 
      href: '/admin/promotions',
    },
    { 
      icon: Star, 
      label: 'Reviews', 
      href: '/admin/reviews',
    },
    { 
      icon: Video, 
      label: 'Testimonials', 
      href: '/admin/testimonials',
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      href: '/admin/settings',
      adminOnly: true
    },
    { 
      icon: Shield, 
      label: 'Audit Logs', 
      href: '/admin/audit-logs',
      adminOnly: true
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/omega-logo.png"
              alt="OMEGA Logo"
              width={100}
              height={100}
              className="object-contain"
              priority
            />
          </Link>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'ADMIN') return null;
            
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition relative ${
                    active
                      ? 'text-green-700 bg-green-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {/* Green bar for active */}
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600" />
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      item.badgeColor || 'bg-green-600'
                    } text-white`}>
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Sub-items (if active) */}
                {active && item.subItems && (
                  <div className="bg-gray-50 py-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-6 pl-14 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
                      >
                        <span>{subItem.label}</span>
                        {subItem.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-600 text-white">
                            {subItem.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Page title - hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-gray-900">Admin</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">
              {pathname === '/admin' 
                ? 'DASHBOARD' 
                : pathname.split('/').filter(Boolean).pop()?.replace('-', ' ').toUpperCase() || 'DASHBOARD'}
            </span>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Global Search - hidden on mobile */}
            <form onSubmit={handleGlobalSearch} className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Order ID, phone, product..."
                className="pl-10 pr-4 py-2 w-48 lg:w-64 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </form>

            {/* Search icon for mobile */}
            <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5" />
            </button>

            {/* Alerts */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Quick link to customer site - hidden on mobile */}
            <Link
              href="/"
              target="_blank"
              className="hidden lg:block text-sm text-gray-600 hover:text-gray-900"
            >
              View Store →
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
