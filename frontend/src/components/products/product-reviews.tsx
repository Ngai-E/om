'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuthStore } from '@/lib/store/auth-store';
import { ReviewForm } from '@/components/reviews/review-form';
import { ReviewsList } from '@/components/reviews/reviews-list';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const data = await reviewsApi.getProductReviews(productId);
      setReviews(data.reviews);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    fetchReviews();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#036637] mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Write Review Button - Show above reviews if reviews exist */}
      {!showReviewForm && stats.totalReviews > 0 && isAuthenticated && user?.role === 'CUSTOMER' && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="w-full md:w-auto px-6 py-3 bg-[#036637] hover:bg-[#014D29] text-white rounded-lg transition font-semibold"
        >
          Write a Review
        </button>
      )}

      {/* Reviews List with integrated empty state button */}
      {stats.totalReviews === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600 mb-6">Be the first to review this product!</p>
          
          {isAuthenticated && user?.role === 'CUSTOMER' && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-3 bg-[#036637] hover:bg-[#014D29] text-white rounded-lg transition font-semibold"
            >
              Write a Review
            </button>
          )}
          
          {!isAuthenticated && (
            <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
              Please log in to write a review.
            </div>
          )}
        </div>
      ) : (
        <ReviewsList
          reviews={reviews}
          averageRating={stats.averageRating}
          totalReviews={stats.totalReviews}
        />
      )}
    </div>
  );
}
