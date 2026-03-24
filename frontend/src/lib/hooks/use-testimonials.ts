import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

export interface Testimonial {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestimonialDto {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateTestimonialDto {
  videoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Public hook - fetch active testimonials for homepage
export function useActiveTestimonials() {
  return useQuery<Testimonial[]>({
    queryKey: ['testimonials', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get('/testimonials/active');
      return data;
    },
  });
}

// Admin hook - fetch all testimonials
export function useTestimonials() {
  return useQuery<Testimonial[]>({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data } = await apiClient.get('/testimonials');
      return data;
    },
  });
}

// Admin hook - create testimonial
export function useCreateTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTestimonialDto) => {
      const { data } = await apiClient.post('/testimonials', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials', 'active'] });
    },
  });
}

// Admin hook - update testimonial
export function useUpdateTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTestimonialDto }) => {
      const { data } = await apiClient.patch(`/testimonials/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials', 'active'] });
    },
  });
}

// Admin hook - toggle active status
export function useToggleTestimonialActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(`/testimonials/${id}/toggle-active`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials', 'active'] });
    },
  });
}

// Admin hook - delete testimonial
export function useDeleteTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/testimonials/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials', 'active'] });
    },
  });
}
