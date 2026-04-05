import { Product } from '../types';
import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useEffect, useState } from 'react';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [imageUrl, setImageUrl] = useState('');
  
  const isWishlisted = wishlist.some(item => item.id === product.id);

  useEffect(() => {
    // Fetch unique images for different products using Unsplash
    const fetchImage = async () => {
      try {
        const response = await fetch(
          `https://source.unsplash.com/400x300/?${encodeURIComponent(product.image)}&${product.id}`
        );
        setImageUrl(response.url);
      } catch (error) {
        console.error('Failed to load image:', error);
      }
    };
    fetchImage();
  }, [product.id, product.image]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.variants && product.variants.length > 0) {
      // For products with variants, user should go to detail page
      return;
    }
    
    if (product.stock !== 'out-of-stock') {
      addToCart(product, 1);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const getStockBadge = () => {
    switch (product.stock) {
      case 'in-stock':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>;
      case 'low-stock':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low Stock</Badge>;
      case 'out-of-stock':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>;
    }
  };

  return (
    <Link to={`/product/${product.id}`}>
      <div className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
          >
            <Heart
              className={`w-5 h-5 ${
                isWishlisted ? 'fill-[#FF7730] text-[#FF7730]' : 'text-gray-400'
              }`}
            />
          </button>

          {/* Stock Badge */}
          <div className="absolute top-2 left-2">
            {getStockBadge()}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-1">{product.category}</p>
            <h3 className="font-medium text-[#036637] line-clamp-2 min-h-[3rem]">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-2xl font-bold text-[#036637]">
                £{product.price.toFixed(2)}
              </p>
              {product.variants && product.variants.length > 1 && (
                <p className="text-xs text-gray-500">+ {product.variants.length - 1} variant{product.variants.length > 2 ? 's' : ''}</p>
              )}
            </div>

            {showAddToCart && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={product.stock === 'out-of-stock'}
                className={`${
                  product.variants && product.variants.length > 0
                    ? 'bg-[#036637] hover:bg-[#014D29]'
                    : 'bg-[#FF7730] hover:bg-[#FF6520]'
                }`}
              >
                {product.variants && product.variants.length > 0 ? (
                  'Select'
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
