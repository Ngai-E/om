import { promotions } from '../data/mockData';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Calendar, Tag, Copy, Check } from 'lucide-react';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function Promotions() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch promo images
    const fetchImages = async () => {
      const urls: Record<string, string> = {};
      for (const promo of promotions) {
        try {
          const response = await fetch(
            `https://source.unsplash.com/800x400/?${encodeURIComponent(promo.image)}&${promo.id}`
          );
          urls[promo.id] = response.url;
        } catch (error) {
          console.error('Failed to load image:', error);
        }
      }
      setImageUrls(urls);
    };
    fetchImages();
  }, []);

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Promo code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isPromoActive = (validTo: string) => {
    return new Date(validTo) >= new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-black text-[#036637] mb-2"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            Current Promotions
          </h1>
          <p className="text-gray-600">
            Save more with our exclusive deals and offers
          </p>
        </div>

        {/* Featured Banner */}
        <div className="mb-12">
          <div className="relative bg-gradient-to-r from-[#036637] to-[#014D29] rounded-2xl overflow-hidden">
            <div className="px-8 py-12 md:py-16 text-white">
              <Badge className="bg-[#FF7730] text-white mb-4">
                Limited Time Offer
              </Badge>
              <h2
                className="text-3xl md:text-4xl font-black mb-4"
                style={{ fontFamily: "'Archivo Black', sans-serif" }}
              >
                {promotions[0].title}
              </h2>
              <p className="text-lg mb-6 text-white/90 max-w-2xl">
                {promotions[0].description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {promotions[0].code && (
                  <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-white/30">
                    <p className="text-sm text-white/80 mb-1">Promo Code</p>
                    <p className="text-xl font-bold">{promotions[0].code}</p>
                  </div>
                )}
                <Link to="/products">
                  <Button size="lg" className="bg-[#FF7730] hover:bg-[#FF6520] text-white">
                    Shop Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.slice(1).map(promo => {
            const active = isPromoActive(promo.validTo);
            
            return (
              <div
                key={promo.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-[2/1] bg-gray-100">
                  {imageUrls[promo.id] && (
                    <img
                      src={imageUrls[promo.id]}
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#FF7730] text-white">
                      {promo.discount}
                    </Badge>
                  </div>
                  {!active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge className="bg-red-600 text-white">Expired</Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#036637] mb-2">
                    {promo.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{promo.description}</p>

                  {/* Dates */}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Valid: {formatDate(promo.validFrom)} - {formatDate(promo.validTo)}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {promo.code && (
                      <Button
                        variant="outline"
                        className="flex-1 border-[#036637] text-[#036637] hover:bg-[#E8F5E9]"
                        onClick={() => copyPromoCode(promo.code!)}
                        disabled={!active}
                      >
                        {copiedCode === promo.code ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            {promo.code}
                          </>
                        )}
                      </Button>
                    )}
                    <Link to="/products" className={!promo.code ? 'flex-1' : ''}>
                      <Button
                        className={`${
                          !promo.code ? 'w-full' : ''
                        } bg-[#FF7730] hover:bg-[#FF6520] text-white`}
                        disabled={!active}
                      >
                        <Tag className="w-4 h-4 mr-2" />
                        Shop Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-[#E8F5E9] rounded-lg p-8">
          <h3 className="text-xl font-bold text-[#036637] mb-4">
            How to Use Promo Codes
          </h3>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="font-bold text-[#FF7730] mr-2">1.</span>
              <span>Add your items to the cart</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-[#FF7730] mr-2">2.</span>
              <span>Copy your promo code from this page</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-[#FF7730] mr-2">3.</span>
              <span>Enter the code at checkout to receive your discount</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
