'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import AuthGuard from '@/lib/auth/auth-guard';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  // Handle session expired message from URL params
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'expired') {
      setSessionMessage('Your session has expired. Please login again.');
      // Clear any stale auth data
      AuthGuard.clearAuthData();
      AuthGuard.reset();
    }
  }, [searchParams]);

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

      // Reset AuthGuard after successful login
      AuthGuard.reset();

      // Redirect based on role or redirect param
      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.push(redirect);
      } else if (response.user.role === 'SUPER_ADMIN') {
        router.push('/platform');
      } else if (response.user.role === 'ADMIN') {
        router.push(response.user.tenantId ? '/admin' : '/platform');
      } else if (response.user.role === 'STAFF') {
        router.push('/staff/dashboard');
      } else {
        router.push('/platform');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
        <p className="text-muted-foreground">Sign in to your account to continue</p>
      </div>

      {sessionMessage && (
        <div className="bg-amber-500/10 border border-amber-500/50 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-lg mb-6">
          {sessionMessage}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-2">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            placeholder="you@example.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-destructive text-sm mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold mb-2">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            id="password"
            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            placeholder="Enter your password"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-destructive text-sm mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link 
            href="/register" 
            className="text-primary hover:underline font-semibold"
          >
            Create account
          </Link>
        </p>
      </div>

      {/* Only show test accounts in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground text-center mb-3">Test Accounts (Dev Only):</p>
          <div className="space-y-2 text-xs">
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <strong className="text-foreground">Buyer:</strong> buyer1@example.com / password123
            </div>
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <strong className="text-foreground">Provider:</strong> provider1@example.com / password123
            </div>
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <strong className="text-foreground">Admin:</strong> admin@omegaafroshop.com / Admin123!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
