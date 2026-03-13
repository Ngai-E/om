'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Eye, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';

export function SystemCleanupSection() {
  const { success, error } = useToast();
  const [cleanupCode, setCleanupCode] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Preview cleanup
  const previewCleanup = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.post('/admin/cleanup/preview', { code });
      return data;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      success('Preview loaded successfully');
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Invalid cleanup code');
      setPreviewData(null);
    },
  });

  // Execute cleanup
  const executeCleanup = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.post('/admin/cleanup', { code });
      return data;
    },
    onSuccess: (data) => {
      success(`Database cleaned! ${JSON.stringify(data.results)}`);
      setPreviewData(null);
      setCleanupCode('');
      setShowConfirm(false);
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Cleanup failed');
    },
  });

  const handlePreview = () => {
    if (!cleanupCode.trim()) {
      error('Please enter cleanup code');
      return;
    }
    previewCleanup.mutate(cleanupCode);
  };

  const handleCleanup = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    executeCleanup.mutate(cleanupCode);
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-red-100 rounded-lg">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Database Cleanup</h2>
          <p className="text-sm text-gray-600 mt-1">
            Remove all customer data, orders, and carts. Admin accounts will be preserved.
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-900">
            ⚠️ DANGER ZONE - This action is IRREVERSIBLE!
          </p>
          <p className="text-xs text-red-700 mt-1">
            This will permanently delete ALL customer accounts, orders, carts, addresses, delivery slots, and audit logs.
            Only admin and staff accounts will be preserved. Products and categories will NOT be deleted.
          </p>
        </div>
      </div>

      {/* Cleanup Code Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Developer Cleanup Code *
          </label>
          <input
            type="password"
            value={cleanupCode}
            onChange={(e) => setCleanupCode(e.target.value)}
            placeholder="Enter secret cleanup code"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            This code is set in your backend .env file as CLEANUP_SECRET_CODE
          </p>
        </div>

        {/* Preview Button */}
        <button
          onClick={handlePreview}
          disabled={previewCleanup.isPending || !cleanupCode.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {previewCleanup.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          Preview Cleanup
        </button>

        {/* Preview Results */}
        {previewData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-bold text-yellow-900 mb-3">Preview - What will be deleted:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <p className="text-xs text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-red-600">{previewData.willDelete.customers}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <p className="text-xs text-gray-600">Orders</p>
                <p className="text-2xl font-bold text-red-600">{previewData.willDelete.orders}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <p className="text-xs text-gray-600">Carts</p>
                <p className="text-2xl font-bold text-red-600">{previewData.willDelete.carts}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <p className="text-xs text-gray-600">Cart Items</p>
                <p className="text-2xl font-bold text-red-600">{previewData.willDelete.cartItems}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <p className="text-xs text-gray-600">Addresses</p>
                <p className="text-2xl font-bold text-red-600">{previewData.willDelete.addresses}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <p className="text-xs text-gray-600">Delivery Slots</p>
                <p className="text-2xl font-bold text-red-600">{previewData.willDelete.deliverySlots}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-300">
                <p className="text-xs text-gray-600">Audit Logs</p>
                <p className="text-2xl font-bold text-red-600">{previewData.willDelete.auditLogs}</p>
              </div>
            </div>
            {previewData.warning && (
              <p className="text-sm text-yellow-800 mt-3 font-medium">{previewData.warning}</p>
            )}
          </div>
        )}

        {/* Cleanup Button */}
        {previewData && (
          <div className="space-y-3">
            {!showConfirm ? (
              <button
                onClick={handleCleanup}
                disabled={executeCleanup.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
                Clean Database
              </button>
            ) : (
              <div className="bg-red-100 border-2 border-red-600 rounded-lg p-4">
                <p className="font-bold text-red-900 mb-3">
                  ⚠️ ARE YOU ABSOLUTELY SURE?
                </p>
                <p className="text-sm text-red-800 mb-4">
                  This will permanently delete {previewData.willDelete.customers} customers,{' '}
                  {previewData.willDelete.orders} orders, and all related data. This cannot be undone!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCleanup}
                    disabled={executeCleanup.isPending}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {executeCleanup.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Cleaning...
                      </>
                    ) : (
                      'Yes, Delete Everything'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
