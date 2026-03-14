'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, X, Calendar, AlertCircle, Download, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface DeliveryTemplate {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DeliveryTemplatesTab() {
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DeliveryTemplate | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: '',
    endTime: '',
    capacity: '10',
    isActive: true,
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['delivery-templates'],
    queryFn: async () => {
      const { data } = await apiClient.get('/delivery-slots/templates');
      return data;
    },
  });

  // Create template
  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/delivery-slots/templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-templates'] });
      success('Template created successfully');
      handleCloseModal();
    },
    onError: () => {
      error('Failed to create template');
    },
  });

  // Update template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/delivery-slots/templates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-templates'] });
      success('Template updated successfully');
      handleCloseModal();
    },
    onError: () => {
      error('Failed to update template');
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/delivery-slots/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-templates'] });
      success('Template deleted successfully');
    },
    onError: () => {
      error('Failed to delete template');
    },
  });

  const handleOpenModal = (template?: DeliveryTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setSelectedDays([template.dayOfWeek]);
      setFormData({
        dayOfWeek: template.dayOfWeek,
        startTime: template.startTime,
        endTime: template.endTime,
        capacity: template.capacity.toString(),
        isActive: template.isActive,
      });
    } else {
      setEditingTemplate(null);
      setSelectedDays([]);
      setFormData({
        dayOfWeek: 1,
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
    setEditingTemplate(null);
    setSelectedDays([]);
  };

  const toggleDay = (day: number) => {
    if (editingTemplate) return; // Can't change days when editing
    
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.startTime >= formData.endTime) {
      error('End time must be after start time');
      return;
    }

    if (!editingTemplate && selectedDays.length === 0) {
      error('Please select at least one day');
      return;
    }

    if (editingTemplate) {
      // Update existing template
      const templateData = {
        dayOfWeek: parseInt(formData.dayOfWeek.toString()),
        startTime: formData.startTime,
        endTime: formData.endTime,
        capacity: parseInt(formData.capacity),
        isActive: formData.isActive,
      };
      updateTemplate.mutate({ id: editingTemplate.id, data: templateData });
    } else {
      // Create templates for all selected days
      try {
        const promises = selectedDays.map(dayOfWeek => {
          const templateData = {
            dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            capacity: parseInt(formData.capacity),
            isActive: formData.isActive,
          };
          return apiClient.post('/delivery-slots/templates', templateData);
        });

        await Promise.all(promises);
        queryClient.invalidateQueries({ queryKey: ['delivery-templates'] });
        success(`Created ${selectedDays.length} template(s) successfully`);
        handleCloseModal();
      } catch (err) {
        error('Failed to create templates');
      }
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteTemplate.mutate(deleteConfirm.id);
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const handleExport = () => {
    const exportData = templates.map((t: DeliveryTemplate) => ({
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      capacity: t.capacity,
      isActive: t.isActive,
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-templates-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('Templates exported successfully');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(importData)) {
          error('Invalid file format');
          return;
        }

        // Create all templates
        const promises = importData.map((template: any) => 
          apiClient.post('/delivery-slots/templates', template)
        );

        await Promise.all(promises);
        queryClient.invalidateQueries({ queryKey: ['delivery-templates'] });
        success(`Imported ${importData.length} template(s) successfully`);
      } catch (err) {
        error('Failed to import templates. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  // Group templates by day
  const templatesByDay = templates.reduce((acc: any, template: DeliveryTemplate) => {
    if (!acc[template.dayOfWeek]) {
      acc[template.dayOfWeek] = [];
    }
    acc[template.dayOfWeek].push(template);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Weekly Delivery Templates</h3>
          <p className="text-sm text-gray-600">Create recurring time slots that auto-generate each week</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-templates"
          />
          <label
            htmlFor="import-templates"
            className="flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import
          </label>
          <button
            onClick={handleExport}
            disabled={templates.length === 0}
            className="flex items-center gap-2 px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">
            Templates automatically create delivery slots for future dates
          </p>
          <p className="text-xs text-blue-700 mt-1">
            For example, a Monday 9:00-11:00 template will create that slot for every Monday going forward.
          </p>
        </div>
      </div>

      {/* Templates by Day */}
      <div className="space-y-4">
        {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
          const dayTemplates = templatesByDay[dayOfWeek] || [];
          
          return (
            <div key={dayOfWeek} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <h4 className="font-bold text-gray-900">{dayNames[dayOfWeek]}</h4>
                  <span className="text-sm text-gray-500">
                    ({dayTemplates.length} {dayTemplates.length === 1 ? 'slot' : 'slots'})
                  </span>
                </div>
              </div>

              {dayTemplates.length > 0 ? (
                <div className="divide-y">
                  {dayTemplates.map((template: DeliveryTemplate) => (
                    <div key={template.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">
                              {template.startTime} - {template.endTime}
                            </span>
                            <span className="text-sm text-gray-600">
                              Capacity: <span className="font-semibold">{template.capacity}</span>
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                template.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(template)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500">No templates for {dayNames[dayOfWeek]}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Add Template'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Day of Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingTemplate ? 'Day of Week' : 'Select Days *'}
                </label>
                {editingTemplate ? (
                  // Show single day when editing
                  <div className="px-4 py-2 border rounded-lg bg-gray-50">
                    <span className="font-medium">{dayNames[formData.dayOfWeek]}</span>
                  </div>
                ) : (
                  // Show checkboxes when creating
                  <div className="grid grid-cols-2 gap-2">
                    {dayNames.map((day, index) => (
                      <label
                        key={index}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                          selectedDays.includes(index)
                            ? 'bg-green-50 border-green-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(index)}
                          onChange={() => toggleDay(index)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium">{day}</span>
                      </label>
                    ))}
                  </div>
                )}
                {!editingTemplate && selectedDays.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {selectedDays.length} day{selectedDays.length > 1 ? 's' : ''} selected
                  </p>
                )}
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
                  Maximum deliveries per slot
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="templateActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="templateActive" className="text-sm font-medium text-gray-700">
                  Template is active
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
                  {editingTemplate ? 'Update' : 'Create'}
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
        title="Delete Template?"
        message="Are you sure you want to delete this template? This will not affect existing slots that have already been created."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
