import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Heart, ShoppingCart, Minus, Plus, ArrowLeft, Package, Truck } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductVariant } from '../types';
import { toast } from 'sonner';

export function ProductDetail() {
  const { id } = useParams();
  const { products, addToCart, toggleWishlist, wishlist } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
  const [mainImage, setMainImage] = useState('');

  const product = products.find(p => p.id === id);
  const isWishlisted = wishlist.some(item => item.id === id);
  const relatedProducts = products.filter(p => p.category === product?.category && p.id !== id).slice(0, 4);

  useEffect(() => {
    if (product) {
      // Fetch product image
      const fetchImage = async () => {
        try {
          const response = await fetch(
            `https://source.unsplash.com/800x600/?${encodeURIComponent(product.image)}&${product.id}`
          );
          setMainImage(response.url);
        } catch (error) {
          console.error('Failed to load image:', error);
        }
      };
      fetchImage();

      // Set default variant if available
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      }
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <Link to="/products">
            <Button className="bg-[#036637] hover:bg-[#014D29]">
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant?.stockCount || product.stockCount;

  const handleAddToCart = () => {
    if (product.stock === 'out-of-stock' || currentStock === 0) return;
    
    addToCart(product, quantity, selectedVariant);
    toast.success(`Added ${quantity} ${product.name} to cart!`);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const getStockStatus = () => {
    if (currentStock === 0) return { text: 'Out of Stock', color: 'red' };
    if (currentStock < 20) return { text: 'Low Stock', color: 'yellow' };
    return { text: 'In Stock', color: 'green' };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm mb-6">
          <Link to="/" className="text-gray-500 hover:text-[#036637]">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link to="/products" className="text-gray-500 hover:text-[#036637]">
            Products
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-[#036637]">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
              {mainImage && (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">{product.category}</p>
              <h1
                className="text-3xl md:text-4xl font-black text-[#036637] mb-4"
                style={{ fontFamily: "'Archivo Black', sans-serif" }}
              >
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-3 mb-4">
                <Badge
                  className={`${
                    stockStatus.color === 'green'
                      ? 'bg-green-100 text-green-800'
                      : stockStatus.color === 'yellow'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  } hover:bg-opacity-90`}
                >
                  {stockStatus.text}
                </Badge>
                {currentStock > 0 && currentStock < 50 && (
                  <span className="text-sm text-gray-600">
                    Only {currentStock} left!
                  </span>
                )}
              </div>

              <p className="text-4xl font-bold text-[#036637] mb-6">
                £{currentPrice.toFixed(2)}
              </p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Variant
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-[#036637] bg-[#E8F5E9]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{variant.name}</p>
                      <p className="text-sm text-gray-600">£{variant.price.toFixed(2)}</p>
                      {variant.stockCount < 20 && variant.stockCount > 0 && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Only {variant.stockCount} left
                        </p>
                      )}
                      {variant.stockCount === 0 && (
                        <p className="text-xs text-red-600 mt-1">Out of stock</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={currentStock === 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  disabled={currentStock === 0}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 bg-[#FF7730] hover:bg-[#FF6520] text-white"
                onClick={handleAddToCart}
                disabled={currentStock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`${
                  isWishlisted
                    ? 'border-[#FF7730] text-[#FF7730]'
                    : 'border-gray-300'
                }`}
                onClick={handleToggleWishlist}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? 'fill-[#FF7730]' : ''
                  }`}
                />
              </Button>
            </div>

            {/* Delivery Info */}
            <div className="bg-[#E8F5E9] rounded-lg p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <Truck className="w-5 h-5 text-[#036637] mt-0.5" />
                <div>
                  <p className="font-semibold text-[#036637]">Free Delivery</p>
                  <p className="text-sm text-gray-600">On orders over £50</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Package className="w-5 h-5 text-[#036637] mt-0.5" />
                <div>
                  <p className="font-semibold text-[#036637]">Same Day Delivery</p>
                  <p className="text-sm text-gray-600">Order before 2pm</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#036637] data-[state=active]:bg-transparent"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#036637] data-[state=active]:bg-transparent"
              >
                Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <p className="text-gray-700">{product.description}</p>
            </TabsContent>
            <TabsContent value="details" className="mt-6">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stock Status</p>
                    <p className="font-medium">{stockStatus.text}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Product ID</p>
                    <p className="font-medium">{product.id}</p>
                  </div>
                  {product.variants && product.variants.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Variants Available</p>
                      <p className="font-medium">{product.variants.length}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2
              className="text-2xl font-black text-[#036637] mb-6"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
