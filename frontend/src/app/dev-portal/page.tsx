'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Package, Key, TrendingUp, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { tenantFetch } from '@/lib/tenant';

export default function DevPortalPage() {
  const [secretKey, setSecretKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Secret key to access dev portal (in production, use proper auth)
  const DEV_SECRET = process.env.NEXT_PUBLIC_DEV_PORTAL_SECRET || 'omega-dev-2026';

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretKey === DEV_SECRET) {
      setIsAuthenticated(true);
      sessionStorage.setItem('dev_auth', 'true');
    } else {
      alert('Invalid secret key');
    }
  };

  // Check if already authenticated
  useState(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('dev_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['licensing-stats'],
    queryFn: async () => {
      const response = await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/licensing/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Developer Portal</h1>
            <p className="text-gray-600 mt-2">Enter secret key to access</p>
          </div>

          <form onSubmit={handleAuth}>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter secret key"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Access Portal
            </button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              This is a restricted area for authorized developers only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Developer Portal</h1>
                <p className="text-blue-100 text-sm">OMEGA Afro Shop Licensing System</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem('dev_auth');
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold">{stats.totalPackages}</span>
              </div>
              <p className="text-gray-600">Total Packages</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Key className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold">{stats.activeLicenses}</span>
              </div>
              <p className="text-gray-600">Active Licenses</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold">{stats.totalLicenses}</span>
              </div>
              <p className="text-gray-600">Total Licenses</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <span className="text-2xl font-bold">{stats.expiredLicenses}</span>
              </div>
              <p className="text-gray-600">Expired Licenses</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dev-portal/packages"
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-2 border-transparent hover:border-blue-500"
          >
            <Package className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Manage Packages</h3>
            <p className="text-gray-600">Create and configure pricing tiers</p>
          </Link>

          <Link
            href="/dev-portal/licenses"
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-2 border-transparent hover:border-green-500"
          >
            <Key className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Manage Licenses</h3>
            <p className="text-gray-600">Issue, revoke, and track licenses</p>
          </Link>

          <Link
            href="/dev-portal/features"
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-2 border-transparent hover:border-purple-500"
          >
            <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Feature Flags</h3>
            <p className="text-gray-600">Control feature availability</p>
          </Link>
        </div>

        {/* Documentation Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Start Guide</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Create a Package</h3>
              <p className="text-gray-600">Define pricing tiers with feature sets and usage limits.</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">2. Issue Licenses</h3>
              <p className="text-gray-600">Generate license keys for customers and assign them to packages.</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">3. Validate & Track</h3>
              <p className="text-gray-600">Monitor license usage and enforce limits automatically.</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">4. Feature Control</h3>
              <p className="text-gray-600">Enable/disable features based on package tier.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
