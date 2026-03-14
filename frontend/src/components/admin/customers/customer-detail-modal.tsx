'use client';

import { useState } from 'react';
import { X, Ban, CheckCircle, AlertTriangle, Tag, FileText, Package, MapPin, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

interface CustomerDetailModalProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerDetailModal({ customerId, isOpen, onClose }: CustomerDetailModalProps) {
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    riskLevel: '',
    isBlocked: false,
    blockedReason: '',
    adminNotes: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  // Fetch customer details
  const { data: customer, isLoading } = useQuery({
    queryKey: ['admin-customer-detail', customerId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/customers/${customerId}`);
      // Set form data when customer loads
      if (data?.customerProfile) {
        setFormData({
          riskLevel: data.customerProfile.riskLevel || 'LOW',
          isBlocked: data.customerProfile.isBlocked || false,
          blockedReason: data.customerProfile.blockedReason || '',
          adminNotes: data.customerProfile.adminNotes || '',
          tags: data.customerProfile.tags || [],
        });
      }
      return data;
    },
    enabled: isOpen && !!customerId,
  });

  // Update risk mutation
  const updateRisk = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.patch(`/admin/customers/${customerId}/risk`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer-detail', customerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customer-stats'] });
      success('Customer updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      error('Failed to update customer');
    },
  });

  // Recalculate metrics mutation
  const recalculateMetrics = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/admin/customers/${customerId}/metrics`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer-detail', customerId] });
      success('Metrics recalculated successfully');
    },
    onError: () => {
      error('Failed to recalculate metrics');
    },
  });

  if (!isOpen) return null;

  const handleSave = () => {
    updateRisk.mutate(formData);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const profile = customer?.customerProfile;
  const riskScore = customer?.riskScore;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {customer?.firstName} {customer?.lastName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{customer?.email}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-gray-500">Loading customer details...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Risk Assessment */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Risk Assessment</h3>
                    <button
                      onClick={() => recalculateMetrics.mutate()}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      disabled={recalculateMetrics.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 ${recalculateMetrics.isPending ? 'animate-spin' : ''}`} />
                      Recalculate
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`border-2 rounded-lg p-4 ${getRiskColor(riskScore?.level || 'LOW')}`}>
                      <p className="text-sm font-medium mb-1">Risk Level</p>
                      <p className="text-2xl font-bold">{riskScore?.level || 'LOW'}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Risk Score</p>
                      <p className="text-2xl font-bold text-gray-900">{riskScore?.score || 0}/100</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <p className="text-2xl font-bold">
                        {profile?.isBlocked ? (
                          <span className="text-red-600">Blocked</span>
                        ) : (
                          <span className="text-green-600">Active</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {riskScore?.factors && riskScore.factors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</p>
                      <ul className="space-y-1">
                        {riskScore.factors.map((factor: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Customer Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-blue-500" />
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{profile?.totalOrders || 0}</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">£{(profile?.totalSpent || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <X className="w-5 h-5 text-orange-500" />
                      <p className="text-sm text-gray-600">Cancelled</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{profile?.cancelledOrders || 0}</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-5 h-5 text-red-500" />
                      <p className="text-sm text-gray-600">Refunded</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{profile?.returnedOrders || 0}</p>
                  </div>
                </div>

                {/* Admin Controls */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Admin Controls</h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Risk Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Level
                      </label>
                      <select
                        value={formData.riskLevel}
                        onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      >
                        <option value="LOW">🟢 Low Risk</option>
                        <option value="MEDIUM">🟡 Medium Risk</option>
                        <option value="HIGH">🟠 High Risk</option>
                        <option value="CRITICAL">🔴 Critical Risk</option>
                      </select>
                    </div>

                    {/* Block Status */}
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isBlocked}
                          onChange={(e) => setFormData({ ...formData, isBlocked: e.target.checked })}
                          disabled={!isEditing}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Block Customer</span>
                      </label>
                    </div>

                    {/* Block Reason */}
                    {formData.isBlocked && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Block Reason
                        </label>
                        <input
                          type="text"
                          value={formData.blockedReason}
                          onChange={(e) => setFormData({ ...formData, blockedReason: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Enter reason for blocking..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes
                      </label>
                      <textarea
                        value={formData.adminNotes}
                        onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Internal notes about this customer..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                            {isEditing && (
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-blue-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            placeholder="Add tag..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Save/Cancel Buttons */}
                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={updateRisk.isPending}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {updateRisk.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Orders */}
                {customer?.orders && customer.orders.length > 0 && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h3>
                    <div className="space-y-3">
                      {customer.orders.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">£{Number(order.total).toFixed(2)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'DELIVERED' || order.status === 'COLLECTED'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
}
