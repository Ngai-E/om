'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsApi, CreatePromotionDto } from '@/lib/api/promotions';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

export default function NewPromotionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast, success, error: showError, hideToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePromotionDto>({
    name: '',
    description: '',
    imageUrl: '',
    code: '',
    status: 'DRAFT',
    budgetType: 'NONE',
    firstOrderOnly: false,
    allowGuests: true,
    discountType: 'PERCENT',
    discountValue: 0,
    applyToSubtotal: true,
    applyToDeliveryFee: false,
    allowStacking: false,
    priority: 10,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePromotionDto) => promotionsApi.createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      success('Promotion created successfully!');
      setTimeout(() => router.push('/admin/promotions'), 1000);
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.message || 'Failed to create promotion';
      setError(errorMsg);
      showError(errorMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (formData.discountValue <= 0) {
      setError('Discount value must be greater than 0');
      return;
    }
    if (formData.discountType === 'PERCENT' && formData.discountValue > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }

    // Clean up data before submission
    const submitData: any = { ...formData };
    
    // Remove empty optional fields
    if (!submitData.description) delete submitData.description;
    if (!submitData.imageUrl) delete submitData.imageUrl;
    if (!submitData.code) delete submitData.code;
    if (!submitData.startAt) delete submitData.startAt;
    if (!submitData.endAt) delete submitData.endAt;
    if (!submitData.minSubtotal) delete submitData.minSubtotal;
    if (!submitData.maxDiscountPerOrder) delete submitData.maxDiscountPerOrder;
    if (!submitData.allowedFulfillment) delete submitData.allowedFulfillment;
    
    // Budget fields
    if (submitData.budgetType === 'NONE') {
      delete submitData.maxTotalDiscountAmount;
      delete submitData.maxTotalRedemptions;
    } else if (submitData.budgetType === 'TOTAL_DISCOUNT') {
      delete submitData.maxTotalRedemptions;
    } else if (submitData.budgetType === 'TOTAL_USES') {
      delete submitData.maxTotalDiscountAmount;
    }
    
    if (!submitData.maxRedemptionsPerUser) delete submitData.maxRedemptionsPerUser;

    createMutation.mutate(submitData);
  };

  const updateField = (field: keyof CreatePromotionDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/promotions"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Promotions
        </Link>
        <h1 className="text-2xl font-bold">Create New Promotion</h1>
        <p className="text-gray-600">Set up a new discount or promotional offer</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promotion Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., First Order 10% Off"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the promotion and its benefits"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promo Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder="e.g., FIRST10 (leave empty for automatic)"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for automatic promotions. Add a code for manual entry at checkout.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                placeholder="https://example.com/promo-image.jpg"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
          </div>
        </div>

        {/* Discount Settings */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Discount Settings</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => updateField('discountType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => updateField('discountValue', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Discount Per Order
              </label>
              <input
                type="number"
                value={formData.maxDiscountPerOrder || ''}
                onChange={(e) => updateField('maxDiscountPerOrder', e.target.value ? parseFloat(e.target.value) : undefined)}
                min="0"
                step="0.01"
                placeholder="No limit"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cap the maximum discount amount per order (useful for percentage discounts)
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.applyToSubtotal}
                  onChange={(e) => updateField('applyToSubtotal', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Apply to Subtotal</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.applyToDeliveryFee}
                  onChange={(e) => updateField('applyToDeliveryFee', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Apply to Delivery Fee</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => updateField('priority', parseInt(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher priority promotions are applied first (0-100)
              </p>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.allowStacking}
                onChange={(e) => updateField('allowStacking', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Allow Stacking with Other Promotions</span>
            </label>
          </div>
        </div>

        {/* Budget Controls */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Budget Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.budgetType}
                onChange={(e) => updateField('budgetType', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="NONE">No Budget Limit</option>
                <option value="TOTAL_DISCOUNT">Total Discount Amount</option>
                <option value="TOTAL_USES">Total Number of Uses</option>
                <option value="BOTH">Both Amount and Uses</option>
              </select>
            </div>

            {(formData.budgetType === 'TOTAL_DISCOUNT' || formData.budgetType === 'BOTH') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Total Discount Amount (£)
                </label>
                <input
                  type="number"
                  value={formData.maxTotalDiscountAmount || ''}
                  onChange={(e) => updateField('maxTotalDiscountAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 500"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {(formData.budgetType === 'TOTAL_USES' || formData.budgetType === 'BOTH') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Total Redemptions
                </label>
                <input
                  type="number"
                  value={formData.maxTotalRedemptions || ''}
                  onChange={(e) => updateField('maxTotalRedemptions', e.target.value ? parseInt(e.target.value) : undefined)}
                  min="0"
                  placeholder="e.g., 100"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Redemptions Per User
              </label>
              <input
                type="number"
                value={formData.maxRedemptionsPerUser || ''}
                onChange={(e) => updateField('maxRedemptionsPerUser', e.target.value ? parseInt(e.target.value) : undefined)}
                min="0"
                placeholder="No limit"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Eligibility Rules */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Eligibility Rules</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Subtotal (£)
              </label>
              <input
                type="number"
                value={formData.minSubtotal || ''}
                onChange={(e) => updateField('minSubtotal', e.target.value ? parseFloat(e.target.value) : undefined)}
                min="0"
                step="0.01"
                placeholder="No minimum"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed Fulfillment Type
              </label>
              <select
                value={formData.allowedFulfillment || ''}
                onChange={(e) => updateField('allowedFulfillment', e.target.value || undefined)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Both Delivery and Collection</option>
                <option value="DELIVERY">Delivery Only</option>
                <option value="COLLECTION">Collection Only</option>
              </select>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.firstOrderOnly}
                onChange={(e) => updateField('firstOrderOnly', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">First Order Only</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.allowGuests}
                onChange={(e) => updateField('allowGuests', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Allow Guest Checkout</span>
            </label>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Schedule</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startAt || ''}
                onChange={(e) => updateField('startAt', e.target.value || undefined)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.endAt || ''}
                onChange={(e) => updateField('endAt', e.target.value || undefined)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Promotion'}
          </button>
          
          <Link
            href="/admin/promotions"
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
    {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </AdminLayout>
  );
}
