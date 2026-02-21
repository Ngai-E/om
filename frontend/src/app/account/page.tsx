'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, Package, Lock } from 'lucide-react';
import { useProfile } from '@/lib/hooks/use-account';
import { useAuthStore } from '@/lib/store/auth-store';

export default function AccountPage() {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <div className="max-w-4xl grid md:grid-cols-2 gap-6">
          {/* Profile Info */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">
                  {profile?.firstName} {profile?.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </p>
                <p className="font-semibold">{profile?.email}</p>
              </div>

              {profile?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </p>
                  <p className="font-semibold">{profile.phone}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="font-semibold capitalize">{profile?.role.toLowerCase()}</p>
              </div>

              <Link
                href="/account/edit"
                className="inline-block w-full text-center bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition mt-4"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            {/* Addresses */}
            <Link
              href="/account/addresses"
              className="block bg-card border rounded-lg p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-6 h-6 text-primary" />
                <h3 className="font-bold text-lg">Delivery Addresses</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your saved delivery addresses
              </p>
            </Link>

            {/* Orders */}
            <Link
              href="/orders"
              className="block bg-card border rounded-lg p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-6 h-6 text-primary" />
                <h3 className="font-bold text-lg">Order History</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                View your past orders and track deliveries
              </p>
            </Link>

            {/* Security */}
            <Link
              href="/account/security"
              className="block bg-card border rounded-lg p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-6 h-6 text-primary" />
                <h3 className="font-bold text-lg">Security</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Change your password and security settings
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
