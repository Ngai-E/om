import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

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
    const response = await axios.post(`${API_URL}/reviews`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getMyReviews: async (token: string): Promise<Review[]> => {
    const response = await axios.get(`${API_URL}/reviews/my-reviews`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  deleteReview: async (reviewId: string, token: string): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_URL}/reviews/${reviewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Public endpoints
  getProductReviews: async (productId: string): Promise<ProductReviewsResponse> => {
    const response = await axios.get(`${API_URL}/reviews/product/${productId}`);
    return response.data;
  },

  // Admin/Staff endpoints
  getPendingReviews: async (token: string): Promise<Review[]> => {
    const response = await axios.get(`${API_URL}/reviews/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getAllReviews: async (token: string, status?: string): Promise<Review[]> => {
    const params = status ? { status } : {};
    const response = await axios.get(`${API_URL}/reviews/all`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  approveReview: async (reviewId: string, token: string): Promise<Review> => {
    const response = await axios.patch(
      `${API_URL}/reviews/${reviewId}/approve`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  rejectReview: async (
    reviewId: string,
    data: ApproveReviewDto,
    token: string
  ): Promise<Review> => {
    const response = await axios.patch(
      `${API_URL}/reviews/${reviewId}/reject`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
