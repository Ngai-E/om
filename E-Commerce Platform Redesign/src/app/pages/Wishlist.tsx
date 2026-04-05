import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';

export function Wishlist() {
  const { wishlist } = useStore();

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1
            className="text-3xl md:text-4xl font-black text-[#036637] mb-8"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            My Wishlist
          </h1>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-6 bg-gray-100 rounded-full">
                <Heart className="w-16 h-16 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start adding your favorite products to your wishlist!
            </p>
            <Link to="/products">
              <Button className="bg-[#FF7730] hover:bg-[#FF6520] text-white">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-black text-[#036637] mb-2"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            My Wishlist
          </h1>
          <p className="text-gray-600">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
