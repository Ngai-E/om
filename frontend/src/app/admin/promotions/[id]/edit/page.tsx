'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsApi, CreatePromotionDto } from '@/lib/api/promotions';
import { ArrowLeft, Save, AlertCircle, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

export default function EditPromotionPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast, success, error: showError, hideToast } = useToast();
  const promotionId = params.id as string;
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePromotionDto | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
      return response.json();
    },
  });

  const allowImageUpload = settings?.allow_image_upload ?? true;
  const allowImageLink = settings?.allow_image_link ?? true;

  const { data: promotion, isLoading } = useQuery({
    queryKey: ['promotion', promotionId],
    queryFn: () => promotionsApi.getPromotion(promotionId),
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        imageUrl: promotion.imageUrl || '',
        code: promotion.code || '',
        status: promotion.status,
        startAt: promotion.startAt || undefined,
        endAt: promotion.endAt || undefined,
        budgetType: promotion.budgetType,
        maxTotalDiscountAmount: promotion.maxTotalDiscountAmount || undefined,
        maxTotalRedemptions: promotion.maxTotalRedemptions || undefined,
        maxRedemptionsPerUser: promotion.maxRedemptionsPerUser || undefined,
        minSubtotal: promotion.minSubtotal || undefined,
        firstOrderOnly: promotion.firstOrderOnly,
        allowedFulfillment: promotion.allowedFulfillment || undefined,
        allowGuests: promotion.allowGuests,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscountPerOrder: promotion.maxDiscountPerOrder || undefined,
        applyToSubtotal: promotion.applyToSubtotal,
        applyToDeliveryFee: promotion.applyToDeliveryFee,
        allowStacking: promotion.allowStacking,
        priority: promotion.priority,
      });
    }
  }, [promotion]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreatePromotionDto>) => 
      promotionsApi.updatePromotion(promotionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion', promotionId] });
      success('Promotion updated successfully!');
      setTimeout(() => router.push('/admin/promotions'), 1000);
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.message || 'Failed to update promotion';
      setError(errorMsg);
      showError(errorMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
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

    updateMutation.mutate(submitData);
  };

  const updateField = (field: keyof CreatePromotionDto, value: any) => {
    if (formData) {
      setFormData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const uploadConfig = {
        service: settings?.image_upload_service || 'imgbb',
        imgbbApiKey: settings?.imgbb_api_key,
        cloudinaryConfig: settings?.cloudinary_config,
      };

      const { uploadImage } = await import('@/lib/utils/image-upload');
      const result = await uploadImage(file, uploadConfig);
      
      updateField('imageUrl', result.url);
      setUploadPreview(result.url);
      success('Image uploaded successfully!');
    } catch (err: any) {
      showError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
      </AdminLayout>
    );
  }

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
        <h1 className="text-2xl font-bold">Edit Promotion</h1>
        <p className="text-gray-600">{promotion?.name}</p>
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

      {/* Form - Same as create form */}
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
                Promotion Image
              </label>
              
              {allowImageLink && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">
                    {allowImageUpload ? 'Enter image URL' : 'Image URL'}
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => updateField('imageUrl', e.target.value)}
                    placeholder="https://example.com/promo-image.jpg"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}

              {allowImageUpload && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">
                    {allowImageLink ? 'Or upload an image' : 'Upload Image'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {isUploading && (
                    <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                  )}
                </div>
              )}

              {(uploadPreview || formData.imageUrl) && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <img
                    src={uploadPreview || formData.imageUrl}
                    alt="Promotion preview"
                    className="w-full max-w-md h-48 rounded object-cover border"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Invalid+Image';
                    }}
                  />
                </div>
              )}
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
                <option value="ENDED">Ended</option>
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
                value={formData.startAt ? new Date(formData.startAt).toISOString().slice(0, 16) : ''}
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
                value={formData.endAt ? new Date(formData.endAt).toISOString().slice(0, 16) : ''}
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
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
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
