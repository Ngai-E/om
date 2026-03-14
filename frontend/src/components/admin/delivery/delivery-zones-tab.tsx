'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { adminApi } from '@/lib/api/admin';

interface DeliveryZone {
  id: string;
  name: string;
  postcodePrefix: string[];
  deliveryFee: number;
  minOrderValue: number;
  freeDeliveryThreshold: number | null;
  isActive: boolean;
}

export function DeliveryZonesTab() {
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [formData, setFormData] = useState({
    name: '',
    postcodePrefix: '',
    deliveryFee: '',
    minOrderValue: '',
    freeDeliveryThreshold: '',
    isActive: true,
  });

  // Fetch zones from API
  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => adminApi.getDeliveryZones(),
  });

  // Create mutation
  const createZone = useMutation({
    mutationFn: (data: any) => adminApi.createDeliveryZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      success('Zone created successfully');
      handleCloseModal();
    },
    onError: () => {
      error('Failed to create zone');
    },
  });

  // Update mutation
  const updateZone = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateDeliveryZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      success('Zone updated successfully');
      handleCloseModal();
    },
    onError: () => {
      error('Failed to update zone');
    },
  });

  // Delete mutation
  const deleteZoneMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDeliveryZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      success('Zone deleted successfully');
    },
    onError: () => {
      error('Failed to delete zone');
    },
  });

  const handleOpenModal = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        postcodePrefix: zone.postcodePrefix.join(', '),
        deliveryFee: zone.deliveryFee.toString(),
        minOrderValue: zone.minOrderValue.toString(),
        freeDeliveryThreshold: zone.freeDeliveryThreshold?.toString() || '',
        isActive: zone.isActive,
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: '',
        postcodePrefix: '',
        deliveryFee: '',
        minOrderValue: '',
        freeDeliveryThreshold: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingZone(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const zoneData = {
      name: formData.name,
      postcodePrefix: formData.postcodePrefix.split(',').map((p: string) => p.trim()),
      deliveryFee: parseFloat(formData.deliveryFee),
      minOrderValue: parseFloat(formData.minOrderValue),
      freeDeliveryThreshold: formData.freeDeliveryThreshold ? parseFloat(formData.freeDeliveryThreshold) : null,
      isActive: formData.isActive,
    };

    if (editingZone) {
      updateZone.mutate({ id: editingZone.id, data: zoneData });
    } else {
      createZone.mutate(zoneData);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteZoneMutation.mutate(deleteConfirm.id);
      setDeleteConfirm({ show: false, id: null });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Delivery Zones</h3>
          <p className="text-sm text-gray-600">Configure delivery zones with postcode ranges and fees</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Zone
        </button>
      </div>

      {/* Zones Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-sm text-gray-700">Zone Name</th>
              <th className="text-left p-4 font-medium text-sm text-gray-700">Postcodes</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Delivery Fee</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Min Order</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Free Delivery At</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Status</th>
              <th className="text-right p-4 font-medium text-sm text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone: DeliveryZone) => (
              <tr key={zone.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{zone.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {zone.postcodePrefix.map((code: string) => (
                      <span
                        key={code}
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="font-semibold text-green-600">£{Number(zone.deliveryFee).toFixed(2)}</span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-sm text-gray-600">£{Number(zone.minOrderValue).toFixed(2)}</span>
                </td>
                <td className="p-4 text-center">
                  {zone.freeDeliveryThreshold ? (
                    <span className="text-sm text-gray-600">£{Number(zone.freeDeliveryThreshold).toFixed(2)}</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      zone.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal(zone)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {zones.length === 0 && (
          <div className="p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No delivery zones configured</p>
            <p className="text-sm text-gray-400 mt-1">Add your first delivery zone to get started</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Zone Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Bolton Central"
                  required
                />
              </div>

              {/* Postcode Prefixes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode Prefixes * <span className="text-gray-500 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={formData.postcodePrefix}
                  onChange={(e) => setFormData({ ...formData, postcodePrefix: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., BL1, BL2, BL3"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter postcode prefixes separated by commas
                </p>
              </div>

              {/* Delivery Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Fee (£) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="3.99"
                  required
                />
              </div>

              {/* Min Order Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Value (£) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="20.00"
                  required
                />
              </div>

              {/* Free Delivery Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Delivery Threshold (£) <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.freeDeliveryThreshold}
                  onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="50.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Orders above this amount get free delivery
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Zone is active
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  {editingZone ? 'Update Zone' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Delivery Zone?"
        message="Are you sure you want to delete this delivery zone? Addresses in this zone will no longer be eligible for delivery."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
