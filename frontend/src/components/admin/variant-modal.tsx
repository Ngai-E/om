'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const variantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional().or(z.literal('')),
  price: z.string().min(1, 'Price is required'),
  compareAtPrice: z.string().optional().or(z.literal('')),
  stock: z.string(),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: variant ? {
      name: variant.name,
      sku: variant.sku || '',
      price: variant.price.toString(),
      compareAtPrice: variant.compareAtPrice?.toString() || '',
      stock: variant.stock.toString(),
      isActive: variant.isActive,
    } : {
      name: '',
      sku: '',
      price: '',
      compareAtPrice: '',
      stock: '0',
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
        isActive: variant.isActive,
      });
    } else {
      reset({
        name: '',
        sku: '',
        price: '',
        compareAtPrice: '',
        stock: '0',
        isActive: true,
      });
    }
  }, [variant, reset]);

  const handleFormSubmit = async (data: VariantFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save variant:', error);
    } finally {
      setIsSubmitting(false);
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
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : variant ? 'Update Variant' : 'Add Variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
