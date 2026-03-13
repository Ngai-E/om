'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Plus, Edit, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { useAdminProduct, useCategories } from '@/lib/hooks/use-products';
import { AdminLayout } from '@/components/admin/admin-layout';
import { VariantModal } from '@/components/admin/variant-modal';
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
  trackInventory: z.boolean().default(true),
  quantity: z.string().optional(),
  lowStockThreshold: z.string().optional(),
});

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id as string;
  
  const { data: product, isLoading: productLoading } = useAdminProduct(productId);
  const { data: categories } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const { toast, success, error, hideToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
  });

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        compareAtPrice: product.compareAtPrice || '',
        categoryId: product.categoryId,
        imageUrl: product.images?.[0]?.url || '',
        tags: product.tags?.join(', ') || '',
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        trackInventory: product.inventory?.isTracked || false,
        quantity: product.inventory?.quantity?.toString() || '',
        lowStockThreshold: product.inventory?.lowStockThreshold?.toString() || '',
      });
    }
  }, [product, reset]);

  const updateProduct = useMutation({
    mutationFn: (data: any) => productsApi.updateProduct(productId, data),
    onSuccess: async () => {
      // Invalidate and refetch all product queries
      await queryClient.invalidateQueries({ 
        queryKey: ['products'],
        refetchType: 'all' 
      });
      // Invalidate specific product query
      await queryClient.invalidateQueries({ 
        queryKey: ['product', productId],
        refetchType: 'all'
      });
      
      success('Product updated successfully!');
      
      // Navigate after cache is invalidated
      setTimeout(() => router.push('/admin/products'), 1500);
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to update product';
      const errors = err.response?.data?.errors;
      error(message, errors);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: () => productsApi.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      success('Product deleted successfully!');
      setTimeout(() => router.push('/admin/products'), 1000);
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to delete product';
      error(message);
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

      // Always send images array - empty array will delete all images
      if (data.imageUrl && data.imageUrl.trim()) {
        payload.images = [{
          url: data.imageUrl.trim(),
          altText: data.name,
          sortOrder: 0,
        }];
      } else {
        payload.images = []; // Empty array to delete all images
      }

      if (data.trackInventory) {
        payload.inventory = {
          quantity: parseInt(data.quantity || '0'),
          lowStockThreshold: parseInt(data.lowStockThreshold || '5'),
          isTracked: true,
        };
      }

      await updateProduct.mutateAsync(payload);
    } catch (err: any) {
      // Error handled by mutation onError
      console.error('Update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      await deleteProduct.mutateAsync();
    } catch (err: any) {
      error('Failed to delete product');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Variant handlers
  const handleAddVariant = () => {
    setEditingVariant(null);
    setShowVariantModal(true);
  };

  const handleEditVariant = (variant: any) => {
    setEditingVariant(variant);
    setShowVariantModal(true);
  };

  const handleSaveVariant = async (variantData: any) => {
    try {
      if (editingVariant) {
        // Update existing variant
        await productsApi.updateVariant(productId, editingVariant.id, variantData);
        success('Variant updated successfully');
      } else {
        // Create new variant
        await productsApi.createVariant(productId, variantData);
        success('Variant added successfully');
      }
      // Refresh product data
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      setShowVariantModal(false);
      setEditingVariant(null);
    } catch (err: any) {
      error(err.message || 'Failed to save variant');
      throw err;
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      await productsApi.deleteVariant(productId, variantId);
      success('Variant deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    } catch (err: any) {
      error('Failed to delete variant');
    }
  };

  if (productLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse">Loading product...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div>Product not found</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              showDeleteConfirm
                ? 'bg-destructive text-destructive-foreground'
                : 'border border-destructive text-destructive hover:bg-destructive/10'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {showDeleteConfirm ? 'Click again to confirm' : 'Delete Product'}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
          {/* Same form fields as create, but with values populated */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  {...register('categoryId')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  {...register('imageUrl')}
                  type="url"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {imageUrl && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-32 h-32 rounded object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  {...register('tags')}
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Compare at Price (£)</label>
                <input
                  {...register('compareAtPrice')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Track inventory</span>
              </label>

              {trackInventory && (
                <div className="grid md:grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <input
                      {...register('quantity')}
                      type="number"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Low Stock Threshold</label>
                    <input
                      {...register('lowStockThreshold')}
                      type="number"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
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
                <input {...register('isActive')} type="checkbox" className="w-4 h-4" />
                <span className="text-sm font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input {...register('isFeatured')} type="checkbox" className="w-4 h-4" />
                <span className="text-sm font-medium">Featured</span>
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/products"
              className="px-6 py-3 border rounded-lg hover:bg-muted transition"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Product Variants Section */}
        <div className="max-w-3xl mt-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">Product Variants</h2>
                <p className="text-sm text-muted-foreground">
                  Add different options like size, color, or weight
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
              >
                <Plus className="w-4 h-4" />
                Add Variant
              </button>
            </div>

            {/* Variants List */}
            {product?.variants && product.variants.length > 0 ? (
              <div className="space-y-3">
                {product.variants.map((variant: any) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{variant.name}</h3>
                        {variant.sku && (
                          <span className="text-xs px-2 py-1 bg-muted rounded">
                            SKU: {variant.sku}
                          </span>
                        )}
                        {!variant.isActive && (
                          <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>£{parseFloat(variant.price).toFixed(2)}</span>
                        {variant.compareAtPrice && (
                          <span className="line-through">
                            £{parseFloat(variant.compareAtPrice).toFixed(2)}
                          </span>
                        )}
                        <span>Stock: {variant.stock}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditVariant(variant)}
                        className="p-2 hover:bg-muted rounded-lg transition"
                        title="Edit variant"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(variant.id)}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition"
                        title="Delete variant"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No variants yet</p>
                <p className="text-xs mt-1">
                  Click "Add Variant" to create different options for this product
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Variants are useful for products with different sizes, colors, or weights.
                Each variant can have its own price, SKU, and stock level.
              </p>
            </div>
          </div>
        </div>
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

      {/* Variant Modal */}
      <VariantModal
        isOpen={showVariantModal}
        onClose={() => {
          setShowVariantModal(false);
          setEditingVariant(null);
        }}
        onSubmit={handleSaveVariant}
        variant={editingVariant}
        productId={productId}
      />
    </AdminLayout>
  );
}
