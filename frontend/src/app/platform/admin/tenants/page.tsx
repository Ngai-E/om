'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: string;
  onboardingStatus: string;
  billingStatus: string;
  createdAt: string;
  subscriptions: Array<{
    plan: {
      name: string;
      code: string;
    };
    status: string;
  }>;
  _count: {
    users: number;
    products: number;
    orders: number;
  };
}

export default function PlatformAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTenants();
  }, [page, statusFilter]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/platform/admin/tenants?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch tenants');

      const data = await response.json();
      setTenants(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTenants();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING_SETUP: 'bg-yellow-100 text-yellow-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      DISABLED: 'bg-gray-100 text-gray-800',
    };

    const icons = {
      ACTIVE: <CheckCircle className="w-4 h-4" />,
      PENDING_SETUP: <Clock className="w-4 h-4" />,
      SUSPENDED: <AlertCircle className="w-4 h-4" />,
      DISABLED: <XCircle className="w-4 h-4" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status as keyof typeof icons]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const suspendTenant = async (tenantId: string) => {
    const reason = prompt('Enter reason for suspension:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/platform/admin/tenants/${tenantId}/suspend`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to suspend tenant');

      alert('Tenant suspended successfully');
      fetchTenants();
    } catch (error) {
      console.error('Error suspending tenant:', error);
      alert('Failed to suspend tenant');
    }
  };

  const activateTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to activate this tenant?')) return;

    try {
      const response = await fetch(`/api/platform/admin/tenants/${tenantId}/activate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to activate tenant');

      alert('Tenant activated successfully');
      fetchTenants();
    } catch (error) {
      console.error('Error activating tenant:', error);
      alert('Failed to activate tenant');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Admin - Tenants</h1>
          <p className="text-gray-600 mt-2">Manage all tenants on the platform</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, slug, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_SETUP">Pending Setup</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DISABLED">Disabled</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading tenants...</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.slug}</div>
                          <div className="text-xs text-gray-400">{tenant.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tenant.status)}
                      </td>
                      <td className="px-6 py-4">
                        {tenant.subscriptions[0] ? (
                          <div>
                            <div className="font-medium text-gray-900">{tenant.subscriptions[0].plan.name}</div>
                            <div className="text-xs text-gray-500">{tenant.subscriptions[0].status}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No subscription</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>{tenant._count.users} users</div>
                          <div>{tenant._count.products} products</div>
                          <div>{tenant._count.orders} orders</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {tenant.status === 'ACTIVE' && (
                            <button
                              onClick={() => suspendTenant(tenant.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Suspend
                            </button>
                          )}
                          {tenant.status === 'SUSPENDED' && (
                            <button
                              onClick={() => activateTenant(tenant.id)}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => window.location.href = `/platform/admin/tenants/${tenant.id}`}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
