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
  const [components, setComponents] = useState({
    customers: true,
    orders: true,
    carts: true,
    addresses: true,
    deliverySlots: true,
    auditLogs: true,
    products: true,
  });

  // Preview cleanup
  const previewCleanup = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.post('/admin/cleanup/preview', { code, components });
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
      const { data } = await apiClient.post('/admin/cleanup', { code, components });
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
            Selectively remove customer data, orders, products, and more. Admin accounts will be preserved.
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
            This will permanently delete selected components. Only admin and staff accounts will be preserved.
            Choose which components to clean below.
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

        {/* Component Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Components to Clean
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={components.customers}
                onChange={(e) => setComponents({ ...components, customers: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium">Customers & Profiles</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={components.orders}
                onChange={(e) => setComponents({ ...components, orders: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium">Orders & Order Items</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={components.carts}
                onChange={(e) => setComponents({ ...components, carts: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium">Carts & Cart Items</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={components.addresses}
                onChange={(e) => setComponents({ ...components, addresses: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium">Addresses</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={components.deliverySlots}
                onChange={(e) => setComponents({ ...components, deliverySlots: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium">Delivery Slots</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={components.auditLogs}
                onChange={(e) => setComponents({ ...components, auditLogs: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium">Audit Logs</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={components.products}
                onChange={(e) => setComponents({ ...components, products: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium">Products & Variants</span>
            </label>
          </div>
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
              {previewData.willDelete.customers !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs text-gray-600">Customers</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.willDelete.customers}</p>
                </div>
              )}
              {previewData.willDelete.orders !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs text-gray-600">Orders</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.willDelete.orders}</p>
                </div>
              )}
              {previewData.willDelete.carts !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs text-gray-600">Carts</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.willDelete.carts}</p>
                </div>
              )}
              {previewData.willDelete.cartItems !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs text-gray-600">Cart Items</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.willDelete.cartItems}</p>
                </div>
              )}
              {previewData.willDelete.addresses !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs text-gray-600">Addresses</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.willDelete.addresses}</p>
                </div>
              )}
              {previewData.willDelete.deliverySlots !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs text-gray-600">Delivery Slots</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.willDelete.deliverySlots}</p>
                </div>
              )}
              {previewData.willDelete.auditLogs !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs text-gray-600">Audit Logs</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.willDelete.auditLogs}</p>
                </div>
              )}
              {previewData.willDelete.products !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.willDelete.products}</p>
                </div>
              )}
              {previewData.willDelete.productVariants !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs text-gray-600">Product Variants</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.willDelete.productVariants}</p>
                </div>
              )}
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
                  This will permanently delete the selected components. This cannot be undone!
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
