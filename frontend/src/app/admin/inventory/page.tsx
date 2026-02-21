'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, AlertTriangle, Package, TrendingDown, Download, Upload, Save, X, Edit2 } from 'lucide-react';
import { useProducts } from '@/lib/hooks/use-products';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { getProductImageUrl } from '@/lib/utils/image';

export default function InventoryManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();

  const { data: productsData, isLoading } = useProducts({ 
    limit: 1000,
    includeInactive: true, // Admin should see all products
  });

  const updateInventory = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      productsApi.updateInventory(productId, { quantity, action: 'SET' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      success('Inventory updated successfully');
      setEditingId(null);
    },
    onError: () => {
      error('Failed to update inventory');
    },
  });

  const handleStartEdit = (productId: string, currentQty: number) => {
    setEditingId(productId);
    setEditQuantity(currentQty);
  };

  const handleSaveEdit = (productId: string) => {
    updateInventory.mutate({ productId, quantity: editQuantity });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuantity(0);
  };

  const exportToCSV = () => {
    const csvData = filteredProducts.map((p) => ({
      Name: p.name,
      Category: p.category.name,
      'Current Stock': p.inventory?.quantity || 0,
      'Low Stock Threshold': p.inventory?.lowStockThreshold || 0,
      Price: parseFloat(p.price).toFixed(2),
      Status: p.inventory?.quantity === 0 ? 'Out of Stock' : 
              p.inventory && p.inventory.quantity <= p.inventory.lowStockThreshold ? 'Low Stock' : 'In Stock',
    }));

    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(','),
      ...csvData.map((row) => headers.map((h) => row[h as keyof typeof row]).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    success('Inventory exported to CSV');
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        // TODO: Parse CSV and update inventory
        success(`CSV file loaded: ${lines.length - 1} rows`);
      } catch (err) {
        error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const products = productsData?.data || [];

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLowStock = !showLowStockOnly || 
        (product.inventory && 
         product.inventory.isTracked && 
         product.inventory.quantity <= product.inventory.lowStockThreshold);
      return matchesSearch && matchesLowStock;
    })
    .sort((a, b) => {
      if (!a.inventory || !b.inventory) return 0;
      return a.inventory.quantity - b.inventory.quantity;
    });

  const lowStockCount = products.filter(
    (p) => p.inventory && p.inventory.isTracked && p.inventory.quantity <= p.inventory.lowStockThreshold
  ).length;

  const outOfStockCount = products.filter(
    (p) => p.inventory && p.inventory.isTracked && p.inventory.quantity === 0
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Bulk Tools */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm font-medium">Low Stock Only</span>
            </label>
          </div>

          {/* Bulk Tools */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium cursor-pointer">
              <Upload className="w-4 h-4" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>

            <div className="flex-1" />
            
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                Out of Stock
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                Low Stock
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Healthy
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse">Loading inventory...</div>
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-center p-4 font-medium">Current Stock</th>
                    <th className="text-center p-4 font-medium">Low Stock Alert</th>
                    <th className="text-center p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const inventory = product.inventory;
                    const isLowStock = inventory && inventory.isTracked && 
                      inventory.quantity <= inventory.lowStockThreshold;
                    const isOutOfStock = inventory && inventory.isTracked && 
                      inventory.quantity === 0;

                    return (
                      <tr key={product.id} className="border-b hover:bg-muted/30 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {product.images && product.images[0] && (
                              <img
                                src={getProductImageUrl(product)}
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover"
                                key={product.updatedAt || product.id}
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                £{parseFloat(product.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{product.category.name}</span>
                        </td>
                        <td className="p-4 text-center">
                          {inventory && inventory.isTracked ? (
                            editingId === product.id ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border-2 border-green-500 rounded text-center font-semibold"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveEdit(product.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="Save"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(product.id, inventory.quantity)}
                                className="group inline-flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 transition"
                              >
                                <span className={`font-bold text-lg ${
                                  isOutOfStock ? 'text-red-600' : 
                                  isLowStock ? 'text-orange-600' : 
                                  'text-green-600'
                                }`}>
                                  {inventory.quantity}
                                </span>
                                <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                              </button>
                            )
                          ) : (
                            <span className="text-muted-foreground text-sm">Not tracked</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {inventory && inventory.isTracked ? (
                            <span className="text-sm text-muted-foreground">
                              {inventory.lowStockThreshold}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {inventory && inventory.isTracked ? (
                            isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                🔴 Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                🟠 Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                🟢 Healthy
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleStartEdit(product.id, inventory?.quantity || 0)}
                            className="text-sm text-blue-600 hover:underline font-medium"
                          >
                            Quick Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
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
