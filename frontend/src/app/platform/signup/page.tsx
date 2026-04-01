'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth-store';
import { Store, CheckCircle, XCircle, Loader2, ArrowRight, Shield } from 'lucide-react';

export default function PlatformSignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    storeName: '',
    slug: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  const updateStoreName = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
    setForm({ ...form, storeName: name, slug });
    if (slug.length >= 3) {
      checkSlug(slug);
    } else {
      setSlugStatus('idle');
    }
  };

  const updateSlug = (slug: string) => {
    const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setForm({ ...form, slug: cleaned });
    if (cleaned.length >= 3) {
      checkSlug(cleaned);
    } else {
      setSlugStatus('idle');
    }
  };

  const checkSlug = useCallback(
    debounce(async (slug: string) => {
      setSlugStatus('checking');
      try {
        const { data } = await apiClient.get(`/onboarding/check-slug?slug=${slug}`);
        setSlugStatus(data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500),
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await apiClient.post('/onboarding/signup', {
        storeName: form.storeName,
        slug: form.slug,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });

      setAuth(data.user, data.accessToken);
      setSuccess(data);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your store is ready!</h1>
          <p className="text-gray-500 mb-6">
            <strong>{success.tenant.name}</strong> has been created with a 14-day free trial.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Store URL</span>
              <span className="font-mono font-medium">{success.tenant.slug}.stores.xxx</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="text-yellow-600 font-medium">Trial (14 days)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Admin</span>
              <span className="font-medium">{success.user.email}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            You can add a custom domain (e.g. yourdomain.com) later from your admin settings.
          </p>

          <button
            onClick={() => router.push('/admin')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            Go to Admin Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Online Store</h1>
          <p className="text-gray-500 mt-1">Start selling with a 14-day free trial. No credit card required.</p>
          <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-400">
            <Shield className="w-3 h-3" />
            <span>Powered by OMEGA Platform</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input
              required
              value={form.storeName}
              onChange={(e) => updateStoreName(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My African Store"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
            <div className="flex items-center border rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
              <input
                required
                value={form.slug}
                onChange={(e) => updateSlug(e.target.value)}
                className="flex-1 px-4 py-3 rounded-l-xl focus:outline-none font-mono text-sm"
                placeholder="my-african-store"
                minLength={3}
              />
              <span className="px-3 text-sm text-gray-400 border-l bg-gray-50 rounded-r-xl py-3">
                .stores.xxx
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 h-5">
              {slugStatus === 'checking' && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                </span>
              )}
              {slugStatus === 'available' && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Available
                </span>
              )}
              {slugStatus === 'taken' && (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Already taken
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">You can connect your own domain (e.g. yourdomain.com) later.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ngai"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Elizabeth"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min. 8 characters"
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+44 7535 316253"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || slugStatus === 'taken'}
            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Creating your store...
              </>
            ) : (
              'Create Store'
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have a store?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
