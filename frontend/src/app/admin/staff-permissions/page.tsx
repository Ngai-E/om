'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Shield, User, Check, X } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
  {
    id: 'inventory',
    label: 'Inventory Management',
    description: 'View and update product inventory levels',
    icon: '📦',
  },
  {
    id: 'customers',
    label: 'Customer Management',
    description: 'View and manage customer information',
    icon: '👥',
  },
];

export default function StaffPermissionsPage() {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);

  const { data: staffMembers = [], isLoading } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: () => adminApi.getAllStaff(),
  });

  const updatePermissions = useMutation({
    mutationFn: async ({ staffId, permissions }: { staffId: string; permissions: string[] }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/staff/${staffId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
      showToast('Permissions updated successfully', 'success');
      setSelectedStaff(null);
      setEditingPermissions([]);
    },
    onError: () => {
      showToast('Failed to update permissions', 'error');
    },
  });

  const handleOpenModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditingPermissions(staff.permissions || []);
  };

  const handleTogglePermission = (permissionId: string) => {
    setEditingPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = () => {
    if (!selectedStaff) return;
    updatePermissions.mutate({
      staffId: selectedStaff.id,
      permissions: editingPermissions,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            Staff Permissions
          </h1>
          <p className="text-gray-600 mt-2">
            Manage fine-grained permissions for staff members
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 How it works:</strong> Grant specific permissions to staff members beyond their default role. 
            Staff will see additional menu items based on their assigned permissions.
          </p>
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading staff members...</p>
            </div>
          ) : staffMembers.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">No staff members found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Staff Member</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Current Permissions</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staffMembers.map((staff: StaffMember) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {staff.firstName} {staff.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{staff.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-700">{staff.email}</p>
                    </td>
                    <td className="p-4">
                      {staff.permissions && staff.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {staff.permissions.map(perm => {
                            const permConfig = AVAILABLE_PERMISSIONS.find(p => p.id === perm);
                            return (
                              <span
                                key={perm}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold"
                              >
                                {permConfig?.icon} {permConfig?.label || perm}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No extra permissions</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          staff.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenModal(staff)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                      >
                        Manage Permissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Permissions Modal */}
        {selectedStaff && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedStaff(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manage Permissions</h2>
                    <p className="text-gray-600 mt-1">
                      {selectedStaff.firstName} {selectedStaff.lastName} ({selectedStaff.email})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStaff(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select the permissions you want to grant to this staff member. They will see additional menu items based on their permissions.
                </p>

                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div
                    key={permission.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      editingPermissions.includes(permission.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTogglePermission(permission.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                            editingPermissions.includes(permission.id)
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {editingPermissions.includes(permission.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{permission.icon}</span>
                          <h3 className="font-bold text-gray-900">{permission.label}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <strong>{editingPermissions.length}</strong> permission{editingPermissions.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedStaff(null)}
                    className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    disabled={updatePermissions.isPending}
                    className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition font-semibold disabled:opacity-50"
                  >
                    {updatePermissions.isPending ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
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
      </div>
    </AdminLayout>
  );
}
