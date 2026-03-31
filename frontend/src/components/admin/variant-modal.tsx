'use client';

import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store/auth-store';
import { tenantFetch } from '@/lib/tenant';

const variantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional().or(z.literal('')),
  price: z.string().min(1, 'Price is required'),
  compareAtPrice: z.string().optional().or(z.literal('')),
  stock: z.string(),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});

type VariantFormData = z.infer<typeof variantSchema>;

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VariantFormData) => Promise<void>;
  variant?: any; // Existing variant for editing
  productId: string;
}

export function VariantModal({ isOpen, onClose, onSubmit, variant, productId }: VariantModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: variant ? {
      name: variant.name,
      sku: variant.sku || '',
      price: variant.price.toString(),
      compareAtPrice: variant.compareAtPrice?.toString() || '',
      stock: variant.stock.toString(),
      imageUrl: variant.imageUrl || '',
      isActive: variant.isActive,
    } : {
      name: '',
      sku: '',
      price: '',
      compareAtPrice: '',
      stock: '0',
      imageUrl: '',
      isActive: true,
    },
  });

  // Reset form when variant changes
  useEffect(() => {
    if (variant) {
      reset({
        name: variant.name,
        sku: variant.sku || '',
        price: variant.price.toString(),
        compareAtPrice: variant.compareAtPrice?.toString() || '',
        stock: variant.stock.toString(),
        imageUrl: variant.imageUrl || '',
        isActive: variant.isActive,
      });
      setImagePreview(variant.imageUrl || '');
    } else {
      reset({
        name: '',
        sku: '',
        price: '',
        compareAtPrice: '',
        stock: '0',
        imageUrl: '',
        isActive: true,
      });
      setImagePreview('');
    }
    setImageFile(null);
  }, [variant, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (data: VariantFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = data.imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadResponse = await tenantFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/upload/variant-image`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        } else {
          throw new Error('Failed to upload image');
        }
        setIsUploading(false);
      }

      await onSubmit({ ...data, imageUrl });
      reset();
      setImageFile(null);
      setImagePreview('');
      onClose();
    } catch (error) {
      console.error('Failed to save variant:', error);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {variant ? 'Edit Variant' : 'Add Variant'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Variant Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Variant Name <span className="text-destructive">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g., Small, Medium, Large"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium mb-2">SKU (Optional)</label>
            <input
              {...register('sku')}
              type="text"
              placeholder="e.g., PROD-SM-001"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.sku && (
              <p className="text-sm text-destructive mt-1">{errors.sku.message}</p>
            )}
          </div>

          {/* Price & Compare At Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Price <span className="text-destructive">*</span>
              </label>
              <input
                {...register('price')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.price && (
                <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Compare At Price (Optional)
              </label>
              <input
                {...register('compareAtPrice')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.compareAtPrice && (
                <p className="text-sm text-destructive mt-1">{errors.compareAtPrice.message}</p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Stock Quantity <span className="text-destructive">*</span>
            </label>
            <input
              {...register('stock')}
              type="number"
              min="0"
              placeholder="0"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.stock && (
              <p className="text-sm text-destructive mt-1">{errors.stock.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Variant Image (Optional)
            </label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
              />
              {imagePreview && (
                <div className="relative w-32 h-32">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      setValue('imageUrl', '');
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Upload a specific image for this variant (recommended for variants with different appearances)
              </p>
            </div>
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active (Available for purchase)
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading Image...' : isSubmitting ? 'Saving...' : variant ? 'Update Variant' : 'Add Variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
