'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (status: string) => void;
  currentStatus: string;
  orderNumber: string;
}

export function StatusUpdateModal({ isOpen, onClose, onUpdate, currentStatus, orderNumber }: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  if (!isOpen) return null;

  const statuses = [
    { value: 'RECEIVED', label: 'Received', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'PICKING', label: 'Picking', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'PACKED', label: 'Packed', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'READY_FOR_COLLECTION', label: 'Ready for Collection', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
    { value: 'COLLECTED', label: 'Collected', color: 'bg-teal-100 text-teal-700 border-teal-300' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'REFUNDED', label: 'Refunded', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  ];

  const handleUpdate = () => {
    onUpdate(selectedStatus);
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
          <p className="text-sm text-gray-600 mb-4">Select the new status for this order:</p>
          <div className="space-y-2">
            {statuses.map((status) => (
              <label
                key={status.value}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedStatus === status.value
                    ? status.color + ' border-current'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={status.value}
                  checked={selectedStatus === status.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="ml-3 font-medium">{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition font-medium"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}
