import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Filter, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { categories } from '../data/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';

export function Products() {
  const { products } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('featured');

  const displayedCategories = showAllCategories ? categories : categories.slice(0, 8);

  // Filter products
  let filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
      return false;
    }
    // Stock filter
    if (selectedStock.length > 0 && !selectedStock.includes(product.stock)) {
      return false;
    }
    return true;
  });

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleStock = (stock: string) => {
    setSelectedStock(prev =>
      prev.includes(stock)
        ? prev.filter(s => s !== stock)
        : [...prev, stock]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedStock([]);
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-[#036637] mb-3 flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Categories
        </h3>
        <div className="space-y-2">
          {displayedCategories.map(category => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategories.includes(category.name)}
                onCheckedChange={() => toggleCategory(category.name)}
              />
              <Label
                htmlFor={`cat-${category.id}`}
                className="text-sm cursor-pointer flex-1"
              >
                {category.icon} {category.name}
                <span className="text-gray-400 ml-1">({category.productCount})</span>
              </Label>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-[#FF7730] hover:text-[#FF6520]"
          onClick={() => setShowAllCategories(!showAllCategories)}
        >
          {showAllCategories ? (
            <>
              Show Less <ChevronUp className="ml-1 w-4 h-4" />
            </>
          ) : (
            <>
              Show More <ChevronDown className="ml-1 w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Stock Status */}
      <div>
        <h3 className="font-semibold text-[#036637] mb-3">Stock Status</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="stock-in"
              checked={selectedStock.includes('in-stock')}
              onCheckedChange={() => toggleStock('in-stock')}
            />
            <Label htmlFor="stock-in" className="text-sm cursor-pointer">
              In Stock
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="stock-low"
              checked={selectedStock.includes('low-stock')}
              onCheckedChange={() => toggleStock('low-stock')}
            />
            <Label htmlFor="stock-low" className="text-sm cursor-pointer">
              Low Stock
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="stock-out"
              checked={selectedStock.includes('out-of-stock')}
              onCheckedChange={() => toggleStock('out-of-stock')}
            />
            <Label htmlFor="stock-out" className="text-sm cursor-pointer">
              Out of Stock
            </Label>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedCategories.length > 0 || selectedStock.length > 0) && (
        <Button
          variant="outline"
          className="w-full border-[#036637] text-[#036637] hover:bg-[#E8F5E9]"
          onClick={clearFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-black text-[#036637] mb-2"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            Our Products
          </h1>
          <p className="text-gray-600">
            Browse our wide selection of authentic Afro-Caribbean groceries
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {/* Mobile Filter Toggle */}
                <Button
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>

                <p className="text-sm text-gray-600">
                  Showing {filteredProducts.length} products
                </p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name: A to Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile Filters */}
            {mobileFiltersOpen && (
              <div className="lg:hidden bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <FilterSidebar />
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500 mb-4">No products found matching your filters.</p>
                <Button
                  variant="outline"
                  className="border-[#036637] text-[#036637] hover:bg-[#E8F5E9]"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
