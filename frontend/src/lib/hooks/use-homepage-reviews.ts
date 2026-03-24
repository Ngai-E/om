import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

export interface HomepageReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export function useHomepageReviews() {
  return useQuery<HomepageReview[]>({
    queryKey: ['homepage-reviews'],
    queryFn: async () => {
      const { data } = await apiClient.get('/reviews/homepage');
      return data;
    },
  });
}
