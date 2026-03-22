'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, AlertTriangle, Package, TrendingDown, Download, Upload, Save, X, Edit2 } from 'lucide-react';
import { useProducts } from '@/lib/hooks/use-products';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { getProductImageUrl } from '@/lib/utils/image';

export default function InventoryManagementPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', searchTerm, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/inventory/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch inventory stats');
      return res.json();
    },
  });

  const updateInventory = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}/inventory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity, action: 'SET' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update inventory');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all admin-products queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      success('Inventory updated successfully');
      setEditingId(null);
    },
    onError: () => {
      error('Failed to update inventory');
    },
  });

  const handleStartEdit = (productId: string, currentQty: number) => {
    console.log('Starting edit for product:', productId, 'Current qty:', currentQty);
    setEditingId(productId);
    setEditQuantity(currentQty);
  };

  const handleSaveEdit = (productId: string) => {
    console.log('Saving edit for product:', productId, 'New qty:', editQuantity);
    if (editQuantity < 0) {
      error('Quantity cannot be negative');
      return;
    }
    updateInventory.mutate({ productId, quantity: editQuantity });
  };

  const handleCancelEdit = () => {
    console.log('Canceling edit');
    setEditingId(null);
    setEditQuantity(0);
  };

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const exportToCSV = () => {
    const csvData = filteredItems.map((item: any) => ({
      Name: item.displayName,
      Category: item.category.name,
      SKU: item.sku || 'N/A',
      'Current Stock': item.stock,
      'Low Stock Threshold': 10,
      Price: parseFloat(item.price).toFixed(2),
      Status: item.stock === 0 ? 'Out of Stock' : 
              item.stock <= 10 ? 'Low Stock' : 'In Stock',
    }));

    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(','),
      ...csvData.map((row: Record<string, string | number>) => headers.map((h) => row[h]).join(',')),
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
  const total = productsData?.pagination?.total || 0;
  const totalPages = productsData?.pagination?.totalPages || 0;

  // Flatten products into variant-based inventory items
  const inventoryItems = products.flatMap((product: any) => {
    if (product.variants && product.variants.length > 0) {
      // For products with variants, create an item for each variant
      return product.variants.map((variant: any) => ({
        id: variant.id,
        type: 'variant',
        productId: product.id,
        productName: product.name,
        variantName: variant.name,
        displayName: `${product.name} - ${variant.name}`,
        category: product.category,
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        imageUrl: variant.imageUrl || (product.images?.[0]?.url),
        isActive: variant.isActive,
        lowStockThreshold: product.inventory?.lowStockThreshold || 10,
      }));
    } else {
      // For products without variants, create a single item
      return [{
        id: product.id,
        type: 'product',
        productId: product.id,
        productName: product.name,
        variantName: null,
        displayName: product.name,
        category: product.category,
        sku: product.sku,
        price: product.price,
        stock: product.inventory?.quantity || 0,
        imageUrl: product.images?.[0]?.url,
        isActive: product.isActive,
        lowStockThreshold: product.inventory?.lowStockThreshold || 10,
      }];
    }
  });

  // Filter inventory items
  const filteredItems = inventoryItems
    .filter((item: any) => {
      const threshold = item.lowStockThreshold || 10;
      const matchesLowStock = !showLowStockOnly || item.stock <= threshold;
      return matchesLowStock;
    })
    .sort((a: any, b: any) => a.stock - b.stock);

  // Get stats from API
  const totalItems = statsData?.totalItems || 0;
  const lowStockCount = statsData?.lowStockCount || 0;
  const outOfStockCount = statsData?.outOfStockCount || 0;

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
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                    <th className="text-left p-4 font-medium">Product / Variant</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-center p-4 font-medium">Stock</th>
                    <th className="text-center p-4 font-medium">Low Stock Alert</th>
                    <th className="text-center p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Price</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item: any) => {
                    const threshold = item.lowStockThreshold || 10;
                    const isLowStock = item.stock <= threshold && item.stock > 0;
                    const isOutOfStock = item.stock === 0;

                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/30 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.displayName}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.displayName}</p>
                              {item.sku && (
                                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{item.category.name}</span>
                        </td>
                        <td className="p-4 text-center">
                          {editingId === item.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border-2 border-green-500 rounded text-center font-semibold"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(item.productId)}
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
                              onClick={() => handleStartEdit(item.id, item.stock)}
                              className="group inline-flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 transition"
                            >
                              <span className={`font-bold text-lg ${
                                isOutOfStock ? 'text-red-600' : 
                                isLowStock ? 'text-orange-600' : 
                                'text-green-600'
                              }`}>
                                {item.stock}
                              </span>
                              <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                            </button>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm text-muted-foreground">{item.lowStockThreshold || 10}</span>
                        </td>
                        <td className="p-4 text-center">
                          {isOutOfStock ? (
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
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-sm text-blue-600 font-medium">£{parseFloat(item.price).toFixed(2)}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleStartEdit(item.id, item.stock)}
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

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No inventory items found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="bg-card border rounded-lg p-4 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Items per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} products
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
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
