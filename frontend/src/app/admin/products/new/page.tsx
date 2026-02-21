'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { useCategories } from '@/lib/hooks/use-products';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/lib/hooks/use-toast';
import { SuccessToast } from '@/components/ui/success-toast';
import { ErrorToast } from '@/components/ui/error-toast';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  compareAtPrice: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  // Inventory
  trackInventory: z.boolean().default(true),
  quantity: z.string().optional(),
  lowStockThreshold: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, success, error, hideToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      isFeatured: false,
      trackInventory: true,
    },
  });

  const createProduct = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: async () => {
      // Invalidate and refetch all product queries
      await queryClient.invalidateQueries({ 
        queryKey: ['products'],
        refetchType: 'all' 
      });
      // Also invalidate categories in case a new one was created
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      // Show success message
      success('Product created successfully!');
      
      // Navigate to products page after a brief delay
      setTimeout(() => router.push('/admin/products'), 1000);
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to create product';
      const errors = err.response?.data?.errors;
      error(message, errors);
    },
  });

  const trackInventory = watch('trackInventory');
  const imageUrl = watch('imageUrl');

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        description: data.description || '',
        price: parseFloat(data.price),
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : undefined,
        categoryId: data.categoryId,
        tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()) : [],
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      };

      // Add image if provided
      if (data.imageUrl) {
        payload.images = [{
          url: data.imageUrl,
          altText: data.name,
          sortOrder: 0,
        }];
      }

      if (data.trackInventory) {
        payload.inventory = {
          quantity: parseInt(data.quantity || '0'),
          lowStockThreshold: parseInt(data.lowStockThreshold || '5'),
          isTracked: true,
        };
      }

      await createProduct.mutateAsync(payload);
    } catch (error: any) {
      // Error is already handled in mutation's onError
      console.error('Product creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
          {/* Basic Info */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Basmati Rice 5kg"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Product description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  {...register('categoryId')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select category...</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  {...register('imageUrl')}
                  type="url"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/image.jpg"
                />
                {errors.imageUrl && (
                  <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a direct URL to the product image
                </p>
                
                {/* Image Preview */}
                {imageUrl && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).alt = 'Invalid image URL';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  {...register('tags')}
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., organic, gluten-free, vegan"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4">Pricing</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price (£) *</label>
                <input
                  {...register('price')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Compare at Price (£)</label>
                <input
                  {...register('compareAtPrice')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">Original price (for sale items)</p>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4">Inventory</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  {...register('trackInventory')}
                  type="checkbox"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium">Track inventory for this product</span>
              </label>

              {trackInventory && (
                <div className="grid md:grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <input
                      {...register('quantity')}
                      type="number"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Low Stock Threshold</label>
                    <input
                      {...register('lowStockThreshold')}
                      type="number"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Alert when stock is below this</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4">Status</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium">Active (visible to customers)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  {...register('isFeatured')}
                  type="checkbox"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium">Featured product</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </button>
            <Link
              href="/admin/products"
              className="px-6 py-3 border rounded-lg hover:bg-muted transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Toast Notifications */}
      {toast?.type === 'success' && (
        <SuccessToast
          title={toast.title}
          message={toast.message}
          onClose={hideToast}
        />
      )}
      {toast?.type === 'error' && (
        <ErrorToast
          title={toast.title}
          message={toast.message}
          errors={toast.errors}
          onClose={hideToast}
        />
      )}
    </AdminLayout>
  );
}
