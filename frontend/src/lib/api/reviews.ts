import apiClient from './client';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export interface ProductReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
}

export interface CreateReviewDto {
  productId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface ApproveReviewDto {
  rejectionReason?: string;
}

export const reviewsApi = {
  // Customer endpoints
  createReview: async (data: CreateReviewDto, token: string): Promise<Review> => {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  },

  getMyReviews: async (token: string): Promise<Review[]> => {
    const response = await apiClient.get('/reviews/my-reviews');
    return response.data;
  },

  deleteReview: async (reviewId: string, token: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // Public endpoints
  getProductReviews: async (productId: string): Promise<ProductReviewsResponse> => {
    const response = await apiClient.get(`/reviews/product/${productId}`);
    return response.data;
  },

  // Admin/Staff endpoints
  getPendingReviews: async (token: string): Promise<Review[]> => {
    const response = await apiClient.get('/reviews/pending');
    return response.data;
  },

  getAllReviews: async (token: string, status?: string): Promise<Review[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/reviews/all', { params });
    return response.data;
  },

  approveReview: async (reviewId: string, token: string): Promise<Review> => {
    const response = await apiClient.patch(`/reviews/${reviewId}/approve`, {});
    return response.data;
  },

  rejectReview: async (
    reviewId: string,
    data: ApproveReviewDto,
    token: string
  ): Promise<Review> => {
    const response = await apiClient.patch(`/reviews/${reviewId}/reject`, data);
    return response.data;
  },
};
