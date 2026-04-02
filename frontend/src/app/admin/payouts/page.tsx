'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantPayoutsApi } from '@/lib/api/tenant-payouts';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Plus,
  Eye,
  Clock,
  CheckCircle,
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

export default function TenantPayoutsPage() {
  const queryClient = useQueryClient();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    bankAccountName: '',
    bankAccountNumber: '',
    bankSortCode: '',
    notes: '',
  });

  // Fetch tenant balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['tenant-balance'],
    queryFn: () => tenantPayoutsApi.getBalance(),
  });

  // Fetch payout requests
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ['tenant-payouts'],
    queryFn: () => tenantPayoutsApi.getPayoutRequests(),
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: (data: any) => tenantPayoutsApi.requestPayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-balance'] });
      setShowRequestModal(false);
      setFormData({
        amount: '',
        paymentMethod: 'bank_transfer',
        bankAccountName: '',
        bankAccountNumber: '',
        bankSortCode: '',
        notes: '',
      });
    },
  });

  const balance = balanceData?.balance;
  const payouts = payoutsData?.payouts || [];

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

  const handleRequestPayout = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return;
    }

    if (parseFloat(formData.amount) > Number(balance?.currentBalance || 0)) {
      return;
    }

    requestPayoutMutation.mutate({
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      bankAccountName: formData.bankAccountName || undefined,
      bankAccountNumber: formData.bankAccountNumber || undefined,
      bankSortCode: formData.bankSortCode || undefined,
      notes: formData.notes || undefined,
    });
  };

  if (balanceLoading || payoutsLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
            <p className="text-gray-500 mt-1">
              Manage your earnings and request payouts
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Request Payout
          </button>
        </div>

        {/* Balance Card */}
        {balance && (
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Balance</h2>
                <p className="text-sm text-gray-500 mt-1">Available for payout</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  £{Number(balance.currentBalance).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Total Earned: £{Number(balance.totalEarned).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div>
                <p className="text-sm text-gray-600">Total Withdrawn</p>
                <p className="font-semibold">£{Number(balance.totalWithdrawn).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Payout</p>
                <p className="font-semibold">
                  {balance.lastPayoutAt
                    ? new Date(balance.lastPayoutAt).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payout Requests */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Payout Requests</h2>
            <p className="text-sm text-gray-500 mt-1">History of your payout requests</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
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
                {payouts.map((payout: Payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
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
                      <button
                        onClick={() => {
                          setSelectedPayout(payout);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payouts.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payout requests</h3>
              <p className="text-gray-500">
                You haven't requested any payouts yet
              </p>
            </div>
          )}
        </div>

        {/* Request Payout Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Request Payout</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Available Balance</label>
                  <div className="text-lg font-bold text-green-600">
                    £{Number(balance?.currentBalance || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={balance?.currentBalance || 0}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                {formData.paymentMethod === 'bank_transfer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bank Account Name</label>
                      <input
                        type="text"
                        value={formData.bankAccountName}
                        onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Account holder name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Account Number</label>
                      <input
                        type="text"
                        value={formData.bankAccountNumber}
                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Bank account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Sort Code</label>
                      <input
                        type="text"
                        value={formData.bankSortCode}
                        onChange={(e) => setFormData({ ...formData, bankSortCode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Sort code"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Any additional notes"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestPayout}
                  disabled={!formData.amount || parseFloat(formData.amount) <= 0 || parseFloat(formData.amount) > Number(balance?.currentBalance || 0) || requestPayoutMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {requestPayoutMutation.isPending ? 'Submitting...' : 'Request Payout'}
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
                <div className="flex justify-between items-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayout.status)}`}>
                    {getStatusIcon(selectedPayout.status)}
                    {selectedPayout.status}
                  </span>
                  <div className="text-sm text-gray-500">
                    {new Date(selectedPayout.createdAt).toLocaleString()}
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

                {selectedPayout.processedAt && (
                  <div className="text-sm text-gray-600">
                    Processed on: {new Date(selectedPayout.processedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
