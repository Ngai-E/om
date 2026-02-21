'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Edit, Trash2, Copy, Power, PowerOff, RefreshCw, Download, Upload } from 'lucide-react';
import { useProducts } from '@/lib/hooks/use-products';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const { toast, success, error, hideToast } = useToast();
  
  const { data: productsData, isLoading, refetch } = useProducts({
    search: searchTerm,
    category: selectedCategory,
    page: 1,
    limit: 50,
    includeInactive: true, // Admin should see all products
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    await refetch();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/export-csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success('Products exported successfully');
    } catch (err) {
      error('Failed to export products');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/import-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Import failed');

      const message = `Import completed: ${result.createdCount || 0} created, ${result.updatedCount || 0} updated, ${result.errorCount || 0} errors`;
      success(message);
      
      // Refresh products list
      await handleRefresh();
    } catch (err: any) {
      error(err.message || 'Failed to import products');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
              disabled={isExporting}
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={handleImportClick}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 font-medium"
              disabled={isImporting}
            >
              <Upload className={`w-4 h-4 ${isImporting ? 'animate-bounce' : ''}`} />
              {isImporting ? 'Importing...' : 'Import CSV'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleRefresh}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 font-medium"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/admin/products/new"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold w-20">Image</th>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Category</th>
                  <th className="text-right p-4 font-semibold">Price</th>
                  <th className="text-center p-4 font-semibold">Stock</th>
                  <th className="text-center p-4 font-semibold">Status</th>
                  <th className="text-center p-4 font-semibold">Updated</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsData?.data.map((product) => (
                  <tr key={product.id} className="border-t hover:bg-muted/50">
                    {/* Image Column */}
                    <td className="p-4">
                      {product.images?.[0]?.url ? (
                        <img
                          src={`${product.images[0].url}?t=${product.updatedAt || Date.now()}`}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg border"
                          key={product.updatedAt || product.id}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </td>
                    
                    {/* Name Column */}
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.slug}</p>
                      </div>
                    </td>
                    
                    {/* Category Column */}
                    <td className="p-4">
                      <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                        {product.category.name}
                      </span>
                    </td>
                    
                    {/* Price Column */}
                    <td className="p-4 text-right">
                      <span className="font-bold text-gray-900">
                        £{parseFloat(product.price).toFixed(2)}
                      </span>
                    </td>
                    
                    {/* Stock Column */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        (product.inventory?.quantity || 0) > 10
                          ? 'bg-green-100 text-green-700'
                          : (product.inventory?.quantity || 0) > 0
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.inventory?.quantity || 0}
                      </span>
                    </td>
                    
                    {/* Status Column */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    
                    {/* Updated Column */}
                    <td className="p-4 text-center">
                      <span className="text-sm text-gray-600">
                        {new Date(product.updatedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    
                    {/* Actions Column */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-2 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Link>
                        <button 
                          className="p-2 hover:bg-orange-50 rounded-lg transition"
                          title={product.isActive ? 'Disable' : 'Enable'}
                        >
                          {product.isActive ? (
                            <PowerOff className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Power className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                        <button 
                          className="p-2 hover:bg-purple-50 rounded-lg transition"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-purple-600" />
                        </button>
                        <button 
                          className="p-2 hover:bg-red-50 rounded-lg transition" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!productsData?.data || productsData.data.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              No products found
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 text-sm text-muted-foreground text-center">
          Showing {productsData?.data.length || 0} of {productsData?.pagination?.total || 0} products
        </div>
      </div>

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </AdminLayout>
  );
}
