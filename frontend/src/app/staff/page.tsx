'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, Search, CreditCard, Package } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

export default function StaffDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'STAFF' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Staff Portal</h1>
        <p className="text-muted-foreground mb-8">
          Welcome, {user?.firstName}! Manage phone orders and customer requests.
        </p>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/staff/phone-order"
            className="bg-card border rounded-lg p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <Phone className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">Create Phone Order</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Take orders over the phone for customers
            </p>
          </Link>

          <Link
            href="/staff/customers"
            className="bg-card border rounded-lg p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">Find Customer</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Search for customer accounts and orders
            </p>
          </Link>

          <Link
            href="/staff/payment-links"
            className="bg-card border rounded-lg p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">Payment Links</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate payment links for customers
            </p>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-muted/50 rounded-lg p-6">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Quick Tips
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold">•</span>
              <span>Always verify customer details before placing an order</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">•</span>
              <span>Check delivery availability for the customer's postcode</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">•</span>
              <span>Confirm payment method and delivery slot with the customer</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">•</span>
              <span>Provide order number to customer for tracking</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
