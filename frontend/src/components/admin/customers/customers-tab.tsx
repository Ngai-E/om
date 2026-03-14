'use client';

import { useState } from 'react';
import { Search, Users, AlertTriangle, Ban, Eye, Filter, Tag, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { CustomerDetailModal } from './customer-detail-modal';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  isActive: boolean;
  customerProfile: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    isBlocked: boolean;
    totalOrders: number;
    totalSpent: number;
    tags: string[];
  };
  _count: {
    orders: number;
  };
}

export function CustomersTab() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [blockedFilter, setBlockedFilter] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Fetch customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['admin-customers', search, riskFilter, blockedFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (search) params.append('search', search);
      if (riskFilter) params.append('riskLevel', riskFilter);
      if (blockedFilter) params.append('isBlocked', blockedFilter);

      const { data } = await apiClient.get(`/admin/customers?${params}`);
      return data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-customer-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/customers/stats');
      return data;
    },
  });

  const customers = customersData?.data || [];
  const meta = customersData?.meta || {};

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-100 text-green-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700';
      case 'CRITICAL':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW':
        return '🟢';
      case 'MEDIUM':
        return '🟡';
      case 'HIGH':
        return '🟠';
      case 'CRITICAL':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage customers, assess risk, and monitor activity
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">✓</span>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blocked</p>
                <p className="text-2xl font-bold text-red-600">{stats.blockedCustomers}</p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-orange-600">{stats.highRiskCustomers}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newCustomersThisMonth}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">+</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Risk Levels</option>
              <option value="LOW">🟢 Low Risk</option>
              <option value="MEDIUM">🟡 Medium Risk</option>
              <option value="HIGH">🟠 High Risk</option>
              <option value="CRITICAL">🔴 Critical Risk</option>
            </select>
          </div>
          <div>
            <select
              value={blockedFilter}
              onChange={(e) => setBlockedFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="false">Active</option>
              <option value="true">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-sm text-gray-700">Customer</th>
              <th className="text-left p-4 font-medium text-sm text-gray-700">Contact</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Risk Level</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Orders</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Total Spent</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Status</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Tags</th>
              <th className="text-right p-4 font-medium text-sm text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-gray-500">
                  Loading customers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((customer: Customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(customer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-sm text-gray-900">{customer.email}</p>
                      {customer.phone && (
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(
                        customer.customerProfile?.riskLevel || 'LOW'
                      )}`}
                    >
                      {getRiskIcon(customer.customerProfile?.riskLevel || 'LOW')}
                      {customer.customerProfile?.riskLevel || 'LOW'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {customer.customerProfile?.totalOrders || customer._count.orders || 0}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-semibold text-gray-900">
                      £{(customer.customerProfile?.totalSpent || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {customer.customerProfile?.isBlocked ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <Ban className="w-3 h-3" />
                        Blocked
                      </span>
                    ) : customer.isActive ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {customer.customerProfile?.tags && customer.customerProfile.tags.length > 0 ? (
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {customer.customerProfile.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                        {customer.customerProfile.tags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{customer.customerProfile.tags.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedCustomer(customer.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} customers
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customerId={selectedCustomer}
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
