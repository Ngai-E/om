'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3x3, Search, Heart, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';

export function MobileNav() {
  const pathname = usePathname();
  const { itemCount } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/products', icon: Grid3x3, label: 'Shop' },
    { href: '/wishlist', icon: Heart, label: 'Wishlist', badge: wishlistItems.length },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: itemCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-3 px-2 relative ${
                isActive
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1/4 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
