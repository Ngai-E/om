'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Shield, Search, Calendar, User, FileText, Filter, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface AuditLog {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId: string;
  changes: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Fetch audit logs
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, pageSize, searchQuery, entityFilter, actionFilter, userFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(entityFilter && { entity: entityFilter }),
        ...(actionFilter && { action: actionFilter }),
        ...(userFilter && { userId: userFilter }),
      });
      const { data } = await apiClient.get(`/admin/audit-logs?${params}`);
      return data;
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getRoleColor = (role: string) => {
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-700';
    if (role === 'STAFF') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-600" />
              Audit Logs
            </h1>
            <p className="text-gray-600 mt-1">Track all system activities and changes</p>
          </div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-gray-900">{total}</span> logs
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Entity Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              >
                <option value="">All Entities</option>
                <option value="Product">Products</option>
                <option value="Order">Orders</option>
                <option value="User">Users</option>
                <option value="Inventory">Inventory</option>
                <option value="Category">Categories</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchQuery('');
                setEntityFilter('');
                setActionFilter('');
                setUserFilter('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Timestamp</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">User</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Action</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Entity</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Entity ID</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No audit logs found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log: AuditLog) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.user.firstName} {log.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{log.user.email}</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleColor(log.user.role)}`}>
                              {log.user.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{log.entity}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {log.entityId.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">{log.ipAddress || 'N/A'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-muted-foreground ml-4">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} logs
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <span className="px-4 py-1.5 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
