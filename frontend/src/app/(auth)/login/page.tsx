'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth-store';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.login(data);
      setAuth(response.user, response.accessToken);

      // Redirect based on role
      if (response.user.role === 'SUPER_ADMIN') {
        router.push('/platform');
      } else if (response.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (response.user.role === 'STAFF') {
        router.push('/staff/dashboard');
      } else {
        router.push('/products');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Sign In</h2>

      {error && (
        <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            id="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>

      {/* Only show test accounts in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 pt-6 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">Test Accounts:</p>
          <div className="space-y-2 text-xs">
            <div className="bg-muted/50 p-2 rounded">
              <strong>Customer:</strong> customer@example.com / Customer123!
            </div>
            <div className="bg-muted/50 p-2 rounded">
              <strong>Staff:</strong> staff@omegaafroshop.com / Staff123!
            </div>
            <div className="bg-muted/50 p-2 rounded">
              <strong>Admin:</strong> admin@omegaafroshop.com / Admin123!
            </div>
            <div className="bg-muted/50 p-2 rounded">
              <strong>Super Admin:</strong> superadmin@omegaafroshop.com / SuperAdmin123!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
