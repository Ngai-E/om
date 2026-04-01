'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Package, Check, X } from 'lucide-react';

async function getPackages() {
  const { data } = await apiClient.get('/licensing/packages?includeInactive=true');
  return data;
}

export default function PackagesPage() {
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['platform-packages'],
    queryFn: getPackages,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Packages & Plans</h1>
        <p className="text-gray-500 mt-1">Manage subscription packages available to tenants</p>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No packages configured</h3>
          <p className="text-gray-500 mb-4">
            Create packages via the API at <code className="bg-gray-100 px-2 py-1 rounded text-sm">POST /v1/licensing/packages</code>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg: any) => {
            const features = (pkg.features as Record<string, boolean>) || {};
            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-xl shadow-sm border p-6 ${
                  !pkg.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{pkg.displayName || pkg.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{pkg.tier}</p>
                  </div>
                  {!pkg.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Inactive</span>
                  )}
                </div>

                <div className="text-3xl font-bold text-gray-900 mb-1">
                  £{parseFloat(pkg.price).toFixed(2)}
                  <span className="text-sm font-normal text-gray-500">/{pkg.billingCycle}</span>
                </div>

                {pkg.description && (
                  <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
                )}

                <div className="border-t pt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Limits</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-bold">{pkg.maxProducts ?? '∞'}</div>
                      <div className="text-xs text-gray-500">Products</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-bold">{pkg.maxOrders ?? '∞'}</div>
                      <div className="text-xs text-gray-500">Orders</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-bold">{pkg.maxUsers ?? '∞'}</div>
                      <div className="text-xs text-gray-500">Users</div>
                    </div>
                  </div>
                </div>

                {Object.keys(features).length > 0 && (
                  <div className="border-t pt-4 mt-4 space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Features</p>
                    {Object.entries(features).map(([key, enabled]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {enabled ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300" />
                        )}
                        <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>{key}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-gray-500">
                    {pkg._count?.licenses ?? 0} active license{(pkg._count?.licenses ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
