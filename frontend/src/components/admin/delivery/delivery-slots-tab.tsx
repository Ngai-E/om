'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, X, Calendar, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { adminApi } from '@/lib/api/admin';
import apiClient from '@/lib/api/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface DeliverySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
  bookedCount?: number;
}

export function DeliverySlotsTab() {
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<DeliverySlot | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    capacity: '10',
    isActive: true,
  });

  // Fetch manually created slots from API
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['delivery-slots', selectedDate],
    queryFn: () => adminApi.getDeliverySlots(selectedDate),
  });

  // Fetch template-generated slots
  const { data: templateSlots = [] } = useQuery({
    queryKey: ['template-slots', selectedDate],
    queryFn: async () => {
      const { data } = await apiClient.get(`/delivery-slots/available?date=${selectedDate}`);
      return data;
    },
    enabled: !!selectedDate,
  });

  // Combine manual slots and template slots
  const allSlots = [
    ...slots,
    ...templateSlots.map((ts: any) => ({
      ...ts,
      id: ts.id,
      date: selectedDate,
      isTemplate: true, // Mark as template-generated
      bookedCount: ts.currentOrders || 0,
    }))
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Create mutation
  const createSlot = useMutation({
    mutationFn: (data: any) => adminApi.createDeliverySlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-slots'] });
      success('Slot created successfully');
      handleCloseModal();
    },
    onError: () => {
      error('Failed to create slot');
    },
  });

  // Update mutation
  const updateSlot = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateDeliverySlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-slots'] });
      success('Slot updated successfully');
      handleCloseModal();
    },
    onError: () => {
      error('Failed to update slot');
    },
  });

  // Delete mutation
  const deleteSlotMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDeliverySlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-slots'] });
      success('Slot deleted successfully');
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to delete slot');
    },
  });

  const handleOpenModal = (slot?: DeliverySlot) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity.toString(),
        isActive: slot.isActive,
      });
    } else {
      setEditingSlot(null);
      setFormData({
        date: selectedDate,
        startTime: '',
        endTime: '',
        capacity: '10',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSlot(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate time window
    if (formData.startTime >= formData.endTime) {
      error('End time must be after start time');
      return;
    }
    
    const slotData = {
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      capacity: formData.capacity,
      isActive: formData.isActive,
    };

    if (editingSlot) {
      updateSlot.mutate({ id: editingSlot.id, data: slotData });
    } else {
      createSlot.mutate(slotData);
    }
  };

  const handleDelete = (id: string) => {
    const slot = slots.find((s: DeliverySlot) => s.id === id);
    const booked = slot?.bookedCount || 0;
    
    if (booked > 0) {
      error(`Cannot delete slot with ${booked} booked order(s)`);
      return;
    }
    
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteSlotMutation.mutate(deleteConfirm.id);
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const getCapacityColor = (booked: number, total: number) => {
    const percentage = (booked / total) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCapacityBgColor = (booked: number, total: number) => {
    const percentage = (booked / total) * 100;
    if (percentage >= 100) return 'bg-red-50 border-red-200';
    if (percentage >= 80) return 'bg-orange-50 border-orange-200';
    if (percentage >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Delivery Time Slots</h3>
          <p className="text-sm text-gray-600">Manage delivery time windows and capacity for specific dates</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Slot
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">
            💡 Tip: Use the "Weekly Templates" tab to create recurring slots automatically
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Templates generate slots based on day of week. This tab is for one-time or specific date slots.
          </p>
        </div>
      </div>

      {/* Slots Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-sm text-gray-700">Date</th>
              <th className="text-left p-4 font-medium text-sm text-gray-700">Time Window</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Capacity</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Booked</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Available</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Utilization</th>
              <th className="text-center p-4 font-medium text-sm text-gray-700">Status</th>
              <th className="text-right p-4 font-medium text-sm text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allSlots.map((slot: any) => {
              const booked = slot.bookedCount || 0;
              const available = slot.capacity - booked;
              const percentage = (booked / slot.capacity) * 100;

              return (
                <tr key={slot.id} className={`border-b hover:bg-gray-50 transition ${slot.isTemplate ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">
                        {formatDate(slot.date)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {slot.isTemplate && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          Template
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-semibold text-gray-900">{slot.capacity}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-bold ${getCapacityColor(booked, slot.capacity)}`}>
                      {booked}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-sm text-gray-600 font-medium">{available}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full max-w-[120px]">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              percentage >= 100
                                ? 'bg-red-500'
                                : percentage >= 80
                                ? 'bg-orange-500'
                                : percentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          slot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {slot.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {percentage >= 100 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          Full
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(slot)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(slot.id, booked)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                        disabled={booked > 0}
                      >
                        <Trash2 className={`w-4 h-4 ${booked > 0 ? 'opacity-50' : ''}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {allSlots.length === 0 && (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No delivery slots for this date</p>
            <p className="text-sm text-gray-400 mt-1">
              Create a weekly template or add a specific slot for this date.
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Slots</p>
              <p className="text-2xl font-bold text-gray-900">{allSlots.length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {allSlots.reduce((sum: number, slot: any) => sum + slot.capacity, 0)}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">∑</span>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Booked</p>
              <p className="text-2xl font-bold text-orange-600">
                {allSlots.reduce((sum: number, slot: any) => sum + (slot.bookedCount || 0), 0)}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {slots.reduce((sum: number, slot: DeliverySlot) => sum + (slot.capacity - (slot.bookedCount || 0)), 0)}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">◯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Time Window */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="10"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of deliveries for this time slot
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="slotActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="slotActive" className="text-sm font-medium text-gray-700">
                  Slot is active and available for booking
                </label>
              </div>

              {/* Warning for editing */}
              {editingSlot && editingSlot.bookedCount && editingSlot.bookedCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      This slot has {editingSlot.bookedCount} existing booking(s)
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Reducing capacity below booked count or changing time may affect existing orders
                    </p>
                  </div>
                </div>
              )}

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
                  {editingSlot ? 'Update Slot' : 'Create Slot'}
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
        title="Delete Time Slot?"
        message="Are you sure you want to delete this delivery time slot? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
