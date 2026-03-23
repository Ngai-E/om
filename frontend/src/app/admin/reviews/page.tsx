'use client';

import { useState, useEffect } from 'react';
import { Star, Check, X, Eye } from 'lucide-react';
import { reviewsApi, Review } from '@/lib/api/reviews';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function AdminReviewsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || (user?.role !== 'ADMIN' && user?.role !== 'STAFF')) {
      router.push('/');
      return;
    }
    fetchReviews();
  }, [token, user, statusFilter]);

  const fetchReviews = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const data = statusFilter === 'PENDING'
        ? await reviewsApi.getPendingReviews(token)
        : await reviewsApi.getAllReviews(token, statusFilter === 'ALL' ? undefined : statusFilter);
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    if (!token) return;
    
    try {
      setProcessingId(reviewId);
      await reviewsApi.approveReview(reviewId, token);
      fetchReviews();
    } catch (error) {
      console.error('Failed to approve review:', error);
      alert('Failed to approve review');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!token || !selectedReviewId) return;
    
    try {
      setProcessingId(selectedReviewId);
      await reviewsApi.rejectReview(selectedReviewId, { rejectionReason }, token);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedReviewId(null);
      fetchReviews();
    } catch (error) {
      console.error('Failed to reject review:', error);
      alert('Failed to reject review');
    } finally {
      setProcessingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-[#FF7730] text-[#FF7730]' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#036637] mb-2">Review Management</h1>
          <p className="text-gray-600">Approve or reject customer reviews</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex gap-2">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? 'bg-[#036637] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#036637] mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Found</h3>
            <p className="text-gray-600">There are no {statusFilter.toLowerCase()} reviews at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {review.user?.firstName} {review.user?.lastName}
                      </h3>
                      {getStatusBadge(review.status)}
                      {review.isVerifiedPurchase && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{review.user?.email}</p>
                    <div className="flex items-center gap-2 mb-3">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Product:</strong> {review.product?.name}
                  </p>
                  {review.title && (
                    <p className="font-semibold text-gray-900 mb-2">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>

                {review.status === 'REJECTED' && review.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {review.rejectionReason}
                    </p>
                  </div>
                )}

                {review.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={processingId === review.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(review.id)}
                      disabled={processingId === review.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Review</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this review:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036637] resize-none mb-4"
                placeholder="Enter rejection reason..."
              />
              <div className="flex gap-3">
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectionReason.trim() || processingId !== null}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                >
                  Reject Review
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedReviewId(null);
                  }}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
