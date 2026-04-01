'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '@/lib/api/platform';
import { ArrowLeft, Globe, Palette, Users, Package, ShoppingCart, Tag, Save } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['platform-tenant', id],
    queryFn: () => platformApi.getTenant(id),
    enabled: !!id,
  });

  const { data: domains } = useQuery({
    queryKey: ['platform-tenant-domains', id],
    queryFn: () => platformApi.getTenantDomains(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (dto: Record<string, any>) => platformApi.updateTenant(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-tenant', id] }),
  });

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    status: '',
    billingStatus: '',
  });

  const startEdit = () => {
    if (tenant) {
      setForm({
        name: tenant.name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        description: tenant.description || '',
        status: tenant.status || '',
        billingStatus: tenant.billingStatus || '',
      });
      setEditMode(true);
    }
  };

  const saveEdit = () => {
    updateMutation.mutate(form, {
      onSuccess: () => setEditMode(false),
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tenant not found</p>
        <Link href="/platform/tenants" className="text-blue-600 hover:underline mt-2 block">
          Back to Tenants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-gray-500 font-mono">{tenant.slug}</p>
        </div>
        {!editMode ? (
          <button
            onClick={startEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Edit Tenant
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Store Information</h2>
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Status</label>
                    <select
                      value={form.billingStatus}
                      onChange={(e) => setForm({ ...form, billingStatus: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TRIAL">Trial</option>
                      <option value="ACTIVE">Active</option>
                      <option value="PAST_DUE">Past Due</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium">{tenant.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium">{tenant.phone || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Description</span>
                  <span className="font-medium text-right max-w-sm">{tenant.description || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Status</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    tenant.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{tenant.status}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Billing</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    tenant.billingStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                    tenant.billingStatus === 'TRIAL' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{tenant.billingStatus}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">{new Date(tenant.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Domains */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" /> Domains
            </h2>
            <div className="space-y-2">
              {domains?.map((domain: any) => (
                <div key={domain.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-mono text-sm">{domain.domain}</span>
                    {domain.isPrimary && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Primary</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    domain.verificationStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {domain.verificationStatus}
                  </span>
                </div>
              ))}
              {(!domains || domains.length === 0) && (
                <p className="text-sm text-gray-500">No domains configured</p>
              )}
            </div>
          </div>

          {/* Branding Preview */}
          {tenant.branding && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" /> Branding
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Primary</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-lg border"
                      style={{ backgroundColor: tenant.branding.primaryColor }}
                    />
                    <span className="font-mono text-sm">{tenant.branding.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Secondary</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-lg border"
                      style={{ backgroundColor: tenant.branding.secondaryColor }}
                    />
                    <span className="font-mono text-sm">{tenant.branding.secondaryColor}</span>
                  </div>
                </div>
                {tenant.branding.accentColor && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Accent</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border"
                        style={{ backgroundColor: tenant.branding.accentColor }}
                      />
                      <span className="font-mono text-sm">{tenant.branding.accentColor}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Usage</h2>
            <div className="space-y-4">
              {[
                { label: 'Users', count: tenant._count?.users ?? 0, icon: Users },
                { label: 'Products', count: tenant._count?.products ?? 0, icon: Package },
                { label: 'Orders', count: tenant._count?.orders ?? 0, icon: ShoppingCart },
                { label: 'Categories', count: tenant._count?.categories ?? 0, icon: Tag },
                { label: 'Promotions', count: tenant._count?.promotions ?? 0, icon: Tag },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active License */}
          {tenant.licenses && tenant.licenses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Active License</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Package</span>
                  <span className="font-medium text-sm">{tenant.licenses[0].package?.displayName || tenant.licenses[0].package?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Tier</span>
                  <span className="font-medium text-sm">{tenant.licenses[0].package?.tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Status</span>
                  <span className="text-sm font-semibold text-green-600">{tenant.licenses[0].status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
