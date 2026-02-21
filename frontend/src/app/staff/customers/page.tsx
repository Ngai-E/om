'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, User, Mail, Phone, MapPin, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/lib/api/staff';

export default function StaffCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customer-search', debouncedQuery],
    queryFn: () => staffApi.searchCustomers(debouncedQuery),
    enabled: debouncedQuery.length >= 3,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff Portal
        </Link>

        <h1 className="text-3xl font-bold mb-8">Customer Lookup</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="max-w-2xl">
            <label className="block text-sm font-medium mb-2">
              Search by name, email, or phone
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter at least 3 characters..."
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={searchQuery.length < 3}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                Search
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Minimum 3 characters required
            </p>
          </div>
        </form>

        {/* Results */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-pulse">Searching...</div>
          </div>
        )}

        {!isLoading && debouncedQuery && customers && customers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No customers found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try a different search term
            </p>
          </div>
        )}

        {customers && customers.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {customers.map((customer: any) => (
                <div
                  key={customer.id}
                  className="bg-card border rounded-lg p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        {customer.firstName} {customer.lastName}
                      </h3>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary mt-1">
                        {customer.role}
                      </span>
                    </div>
                    <Link
                      href={`/staff/phone-order?customerId=${customer.id}`}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition"
                    >
                      Create Order
                    </Link>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{customer.email}</span>
                    </div>

                    {customer.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}

                    {customer._count && (
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{customer._count.orders || 0}</span>
                          <span className="text-muted-foreground">orders</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{customer._count.addresses || 0}</span>
                          <span className="text-muted-foreground">addresses</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!debouncedQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Search for a customer to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
