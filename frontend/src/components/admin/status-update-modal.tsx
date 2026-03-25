'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (status: string) => void;
  currentStatus: string;
  orderNumber: string;
  fulfillmentType?: string;
}

export function StatusUpdateModal({ isOpen, onClose, onUpdate, currentStatus, orderNumber, fulfillmentType = 'DELIVERY' }: StatusUpdateModalProps) {
  if (!isOpen) return null;

  // Define valid status transitions based on current status and fulfillment type
  const getNextStatuses = () => {
    const transitions: Record<string, Array<{ value: string; label: string; description: string; color: string; icon: string }>> = {
      RECEIVED: [
        { value: 'PICKING', label: 'Start Picking', description: 'Begin picking items from inventory', color: 'bg-orange-500 hover:bg-orange-600', icon: '📦' },
        { value: 'CANCELLED', label: 'Cancel Order', description: 'Cancel this order', color: 'bg-red-500 hover:bg-red-600', icon: '❌' },
      ],
      PICKING: [
        { value: 'OUT_FOR_DELIVERY', label: 'Mark as Ready', description: fulfillmentType === 'DELIVERY' ? 'Ready for delivery' : 'Ready for pick up', color: 'bg-purple-500 hover:bg-purple-600', icon: '✅' },
        { value: 'CANCELLED', label: 'Cancel Order', description: 'Cancel this order', color: 'bg-red-500 hover:bg-red-600', icon: '❌' },
      ],
      OUT_FOR_DELIVERY: fulfillmentType === 'DELIVERY' ? [
        { value: 'DELIVERED', label: 'Mark Delivered', description: 'Order has been delivered', color: 'bg-green-500 hover:bg-green-600', icon: '🚚' },
        { value: 'CANCELLED', label: 'Cancel Order', description: 'Cancel this order', color: 'bg-red-500 hover:bg-red-600', icon: '❌' },
      ] : [
        { value: 'COLLECTED', label: 'Mark Collected', description: 'Customer picked up order', color: 'bg-green-500 hover:bg-green-600', icon: '🏪' },
        { value: 'CANCELLED', label: 'Cancel Order', description: 'Cancel this order', color: 'bg-red-500 hover:bg-red-600', icon: '❌' },
      ],
      DELIVERED: [
        { value: 'REFUNDED', label: 'Issue Refund', description: 'Refund this order', color: 'bg-orange-500 hover:bg-orange-600', icon: '💰' },
      ],
      COLLECTED: [
        { value: 'REFUNDED', label: 'Issue Refund', description: 'Refund this order', color: 'bg-orange-500 hover:bg-orange-600', icon: '💰' },
      ],
      CANCELLED: [],
      REFUNDED: [],
    };

    return transitions[currentStatus] || [];
  };

  const nextStatuses = getNextStatuses();

  const handleUpdate = (status: string) => {
    onUpdate(status);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Update Order Status</h2>
            <p className="text-sm text-gray-500 mt-1">Order {orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Status */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">Current Status</p>
            <p className="text-lg font-bold text-blue-700 mt-1">{currentStatus.replace(/_/g, ' ')}</p>
          </div>

          {nextStatuses.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-4">Choose next action:</p>
              <div className="space-y-3">
                {nextStatuses.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleUpdate(status.value)}
                    className={`w-full text-left p-4 rounded-lg text-white transition-all transform hover:scale-[1.02] ${status.color}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{status.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{status.label}</p>
                        <p className="text-sm text-white/90 mt-1">{status.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 font-medium">✅ Order is complete</p>
              <p className="text-sm text-gray-400 mt-2">No further status updates available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
