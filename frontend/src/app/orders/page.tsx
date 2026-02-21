'use client';

import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { useOrders } from '@/lib/hooks/use-orders';

export default function OrdersPage() {
  const { data: ordersData, isLoading } = useOrders(1, 20);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!ordersData || ordersData.data.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Package className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">No orders yet</h1>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        <div className="max-w-4xl space-y-4">
          {ordersData.data.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-card border rounded-lg p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-mono font-semibold">{order.orderNumber}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === 'DELIVERED' || order.status === 'COLLECTED'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-semibold text-primary">
                      £{parseFloat(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>

        {ordersData.pagination && ordersData.pagination.totalPages > 1 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing page {ordersData.pagination.page} of {ordersData.pagination.totalPages}
          </div>
        )}
      </div>
    </div>
  );
}
