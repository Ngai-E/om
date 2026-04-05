import { Link } from 'react-router';
import { ArrowRight, Truck, CreditCard, Shield, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { categories } from '../data/mockData';
import { useState, useEffect } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Home() {
  const { products } = useStore();
  const [heroImage, setHeroImage] = useState('');
  
  const featuredProducts = products.slice(0, 8);
  const displayedCategories = categories.slice(0, 8);

  useEffect(() => {
    // Fetch hero banner image
    const fetchHeroImage = async () => {
      try {
        const response = await fetch(
          'https://source.unsplash.com/1600x600/?african-food,market'
        );
        setHeroImage(response.url);
      } catch (error) {
        console.error('Failed to load hero image:', error);
      }
    };
    fetchHeroImage();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-[#036637] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {heroImage && (
            <img
              src={heroImage}
              alt="Hero"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1
              className="text-4xl md:text-6xl font-black mb-4"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              Authentic Afro-Caribbean Groceries
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Discover the finest selection of African and Caribbean foods, spices, and specialty items delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products">
                <Button size="lg" className="bg-[#FF7730] hover:bg-[#FF6520] text-white w-full sm:w-auto">
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/promotions">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white text-white hover:bg-white/20 w-full sm:w-auto"
                >
                  View Promotions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#E8F5E9] rounded-full">
                <Truck className="w-6 h-6 text-[#036637]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#036637]">Free Delivery</h3>
                <p className="text-sm text-gray-600">On orders over £50</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#FFF5F0] rounded-full">
                <CreditCard className="w-6 h-6 text-[#FF7730]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#036637]">Secure Payment</h3>
                <p className="text-sm text-gray-600">Multiple payment options</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#E8F5E9] rounded-full">
                <Shield className="w-6 h-6 text-[#036637]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#036637]">Quality Guaranteed</h3>
                <p className="text-sm text-gray-600">Fresh & authentic products</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-2xl md:text-3xl font-black text-[#036637]"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              Shop by Category
            </h2>
            <Link to="/products">
              <Button variant="ghost" className="text-[#FF7730] hover:text-[#FF6520]">
                View All
                <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {displayedCategories.map(category => (
              <Link
                key={category.id}
                to={`/products?category=${category.name}`}
                className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-[#036637] hover:shadow-md transition-all group"
              >
                <div className="text-4xl mb-2">{category.icon}</div>
                <h3 className="text-sm text-center font-medium text-gray-700 group-hover:text-[#036637]">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{category.productCount} items</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link to="/products">
              <Button variant="outline" className="border-[#036637] text-[#036637] hover:bg-[#E8F5E9]">
                Show More Categories
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-2xl md:text-3xl font-black text-[#036637]"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              Best Sellers
            </h2>
            <Link to="/products">
              <Button variant="ghost" className="text-[#FF7730] hover:text-[#FF6520]">
                View All
                <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#036637] to-[#014D29] rounded-2xl overflow-hidden">
            <div className="px-8 py-12 md:py-16 text-center text-white">
              <h2
                className="text-3xl md:text-4xl font-black mb-4"
                style={{ fontFamily: "'Archivo Black', sans-serif" }}
              >
                Special Offer This Week!
              </h2>
              <p className="text-lg mb-6 text-white/90">
                Get 20% off on all fresh produce. Limited time only!
              </p>
              <Link to="/promotions">
                <Button size="lg" className="bg-[#FF7730] hover:bg-[#FF6520] text-white">
                  Shop Deals Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
