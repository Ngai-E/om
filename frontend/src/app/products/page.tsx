'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts, useCategories } from '@/lib/hooks/use-products';
import { ProductCard } from '@/components/products/product-card';
import { Menu, X, Filter, ArrowUpDown, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [urlCategory]);

  const { data: productsData, isLoading: productsLoading } = useProducts({
    search: urlSearch || undefined,
    category: selectedCategory || undefined,
    page,
    limit: 20,
  });

  const { data: categories } = useCategories();

  // Helper to format category names to Title Case
  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Limit categories display
  const CATEGORY_LIMIT = 8;
  const displayedCategories = showAllCategories 
    ? categories 
    : categories?.slice(0, CATEGORY_LIMIT);

  // Category icons mapping
  const getCategoryIcon = (index: number) => {
    const icons = ['🌾', '🌶️', '🥤', '🍖', '🧊', '🍪', '🥫', '🍚', '🍌', '🥜', '🍞', '🧈', '🥛', '🍚'];
    return icons[index] || '📦';
  };

  const totalPages = productsData?.pagination?.totalPages || 1;

  // Reset page when category or search changes
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, urlSearch]);

  // Filter and sort products
  const filteredAndSortedProducts = productsData?.data
    ? productsData.data
        .filter((product) => {
          if (showInStockOnly) {
            return product.inventory && product.inventory.quantity > 0;
          }
          return true;
        })
        .sort((a, b) => {
          if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
          } else if (sortBy === 'price-asc') {
            return parseFloat(a.price) - parseFloat(b.price);
          } else if (sortBy === 'price-desc') {
            return parseFloat(b.price) - parseFloat(a.price);
          }
          return 0;
        })
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#036637] mb-2">
            {urlSearch ? `Search: "${urlSearch}"` : selectedCategory ? toTitleCase(categories?.find(c => c.slug === selectedCategory)?.name || '') : 'Our Products'}
          </h1>
          <p className="text-gray-600">
            {urlSearch ? `${filteredAndSortedProducts.length} products found` : 'Browse our wide selection of authentic Afro-Caribbean groceries'}
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="font-semibold text-[#036637] mb-3 flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Categories
                  </h3>
                
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        selectedCategory === ''
                          ? 'bg-[#E8F5E9] text-[#036637] font-medium'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      All Products
                    </button>
                    {displayedCategories?.map((category, index) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          selectedCategory === category.slug
                            ? 'bg-[#E8F5E9] text-[#036637] font-medium'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {getCategoryIcon(index)} {toTitleCase(category.name)}
                      </button>
                    ))}
                  </div>
                  {categories && categories.length > CATEGORY_LIMIT && (
                    <button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="text-sm text-[#FF7730] hover:text-[#FF6520] font-medium inline-flex items-center gap-1 mt-2"
                    >
                      {showAllCategories ? (
                        <>
                          Show Less <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Show More <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Stock Filter */}
                <div>
                  <h3 className="font-semibold text-[#036637] mb-3">Stock Status</h3>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInStockOnly}
                      onChange={(e) => setShowInStockOnly(e.target.checked)}
                      className="w-4 h-4 text-[#036637] border-gray-300 rounded focus:ring-[#036637]"
                    />
                    <span className="text-sm">In Stock Only</span>
                  </label>
                </div>

                {/* Clear Filters */}
                {(selectedCategory || showInStockOnly) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setShowInStockOnly(false);
                    }}
                    className="w-full border-2 border-[#036637] text-[#036637] hover:bg-[#E8F5E9] px-4 py-2 rounded-lg font-medium text-sm transition"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden border border-gray-300 px-4 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-gray-50 transition"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>

                <p className="text-sm text-gray-600">
                  Showing {filteredAndSortedProducts.length} products
                </p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#036637] focus:border-transparent"
                >
                  <option value="name">Name: A to Z</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Mobile Filters */}
            {isMobileMenuOpen && (
              <div className="lg:hidden bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#036637]">Filters</h3>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-[#036637] mb-3">Categories</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          selectedCategory === ''
                            ? 'bg-[#E8F5E9] text-[#036637] font-medium'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        All Products
                      </button>
                      {categories?.map((category, index) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.slug);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                            selectedCategory === category.slug
                              ? 'bg-[#E8F5E9] text-[#036637] font-medium'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {getCategoryIcon(index)} {toTitleCase(category.name)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#036637] mb-3">Stock Status</h4>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInStockOnly}
                        onChange={(e) => setShowInStockOnly(e.target.checked)}
                        className="w-4 h-4 text-[#036637] border-gray-300 rounded focus:ring-[#036637]"
                      />
                      <span className="text-sm">In Stock Only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-card border rounded-lg overflow-hidden animate-pulse">
                    <div className="aspect-square bg-muted" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-6 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500 mb-4">
                  {showInStockOnly
                    ? 'No products in stock matching your filters.'
                    : 'No products found matching your filters.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setShowInStockOnly(false);
                  }}
                  className="border-2 border-[#036637] text-[#036637] hover:bg-[#E8F5E9] px-6 py-2 rounded-lg font-medium transition"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {!productsLoading && filteredAndSortedProducts.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 rounded-lg transition ${
                            page === pageNum
                              ? 'bg-[#036637] text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
