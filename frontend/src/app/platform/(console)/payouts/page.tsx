'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '@/lib/api/platform';
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';

interface Payout {
  id: string;
  tenantId: string;
  tenant: { name: string; email: string };
  amount: number;
  grossAmount: number;
  platformFee: number;
  taxAmount: number;
  netAmount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentMethod: string;
  bankAccountName?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export default function PayoutsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  // Fetch payouts
  const { data: payoutsData, isLoading } = useQuery({
    queryKey: ['platform-payouts', statusFilter],
    queryFn: () => platformApi.getPayouts({
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 50,
    }),
  });

  // Fetch payout stats
  const { data: stats } = useQuery({
    queryKey: ['platform-payout-stats'],
    queryFn: () => platformApi.getPayoutStats(),
  });

  // Fetch tenant balances for creating payouts
  const { data: balances } = useQuery({
    queryKey: ['platform-balances'],
    queryFn: () => platformApi.getTenantBalances(),
  });

  // Update payout status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ payoutId, status, stripePayoutId }: {
      payoutId: string;
      status: string;
      stripePayoutId?: string
    }) => platformApi.updatePayoutStatus(payoutId, status, stripePayoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['platform-payout-stats'] });
      queryClient.invalidateQueries({ queryKey: ['platform-balances'] });
    },
  });

  const payouts = payoutsData?.payouts || [];
  const filteredPayouts = payouts.filter((payout: Payout) =>
    payout.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'PROCESSING': return 'text-blue-600 bg-blue-50';
      case 'FAILED': return 'text-red-600 bg-red-50';
      case 'CANCELLED': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'PROCESSING': return <AlertCircle className="w-4 h-4" />;
      case 'FAILED': return <XCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleUpdateStatus = (payoutId: string, status: string) => {
    updateStatusMutation.mutate({ payoutId, status });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
        <p className="text-gray-500 mt-1">
          Manage tenant payouts and monitor platform revenue
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid Out</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{Number(stats.totalPaidOut).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by tenant name, email, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Payout
            </button>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayouts.map((payout: Payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{payout.tenant.name}</div>
                      <div className="text-sm text-gray-500">{payout.tenant.email}</div>
                      {payout.reference && (
                        <div className="text-xs text-gray-400">Ref: {payout.reference}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      £{payout.grossAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      <div>Platform: £{payout.platformFee.toLocaleString()}</div>
                      <div>Tax: £{payout.taxAmount.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      £{payout.netAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                      {getStatusIcon(payout.status)}
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPayout(payout);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {payout.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(payout.id, 'PROCESSING')}
                          className="text-yellow-600 hover:text-yellow-800 transition"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                      {payout.status === 'PROCESSING' && (
                        <button
                          onClick={() => handleUpdateStatus(payout.id, 'COMPLETED')}
                          className="text-green-600 hover:text-green-800 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayouts.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payouts found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No payouts have been created yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Payout Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create Payout</h2>
            <p className="text-gray-600 mb-4">
              Select a tenant and amount to create a new payout request.
            </p>

            {balances && balances.balances.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {balances.balances
                  .filter((b: any) => Number(b.currentBalance) > 0)
                  .map((balance: any) => (
                    <div key={balance.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{balance.tenant.name}</div>
                          <div className="text-sm text-gray-500">{balance.tenant.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">£{Number(balance.currentBalance).toLocaleString()}</div>
                          <button className="text-sm text-blue-600 hover:text-blue-800">
                            Create Payout
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Details Modal */}
      {showDetailsModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Payout Details</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Tenant</label>
                  <div className="font-medium">{selectedPayout.tenant.name}</div>
                  <div className="text-sm text-gray-500">{selectedPayout.tenant.email}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayout.status)}`}>
                    {getStatusIcon(selectedPayout.status)}
                    {selectedPayout.status}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Financial Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Gross Amount:</span>
                    <span className="font-medium">£{selectedPayout.grossAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span className="font-medium text-red-600">-£{selectedPayout.platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span className="font-medium text-red-600">-£{selectedPayout.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Net Amount:</span>
                    <span className="text-green-600">£{selectedPayout.netAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedPayout.notes && (
                <div>
                  <label className="text-sm text-gray-600">Notes</label>
                  <div className="mt-1">{selectedPayout.notes}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <label className="text-sm text-gray-600">Created</label>
                  <div>{new Date(selectedPayout.createdAt).toLocaleString()}</div>
                </div>
                {selectedPayout.processedAt && (
                  <div>
                    <label className="text-sm text-gray-600">Processed</label>
                    <div>{new Date(selectedPayout.processedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              {selectedPayout.status === 'PENDING' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedPayout.id, 'PROCESSING');
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  Mark Processing
                </button>
              )}
              {selectedPayout.status === 'PROCESSING' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedPayout.id, 'COMPLETED');
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
