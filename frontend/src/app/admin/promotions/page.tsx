'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsApi, Promotion } from '@/lib/api/promotions';
import { Plus, Search, Edit2, Trash2, Play, Pause, StopCircle, TrendingUp, Upload, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

export default function PromotionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: promotionsData, isLoading } = useQuery({
    queryKey: ['promotions', statusFilter, searchQuery],
    queryFn: () => promotionsApi.getAllPromotions({
      status: statusFilter || undefined,
      search: searchQuery || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotionsApi.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      success('Promotion deleted successfully');
    },
    onError: () => {
      error('Failed to delete promotion');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => promotionsApi.activatePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      success('Promotion activated');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => promotionsApi.pausePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      success('Promotion paused');
    },
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => promotionsApi.endPromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      success('Promotion ended');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const promotions = JSON.parse(text);
      
      const result = await promotionsApi.importPromotions(promotions);
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      
      if (result.failed > 0) {
        error(`Import: ${result.success} successful, ${result.skipped} skipped, ${result.failed} failed`);
        console.error('Import errors:', result.errors);
      } else if (result.skipped > 0) {
        success(`Imported ${result.success} new promotions! (${result.skipped} already exist)`);
      } else {
        success(`Successfully imported ${result.success} promotions!`);
      }
    } catch (err) {
      error('Failed to import promotions. Please check the file format.');
      console.error(err);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await promotionsApi.exportPromotions();
      
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promotions-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      success(`Exported ${result.count} promotions successfully!`);
    } catch (err) {
      error('Failed to export promotions');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      ENDED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getDiscountDisplay = (promo: Promotion) => {
    if (promo.discountType === 'PERCENT') {
      return `${promo.discountValue}% OFF`;
    }
    return `£${promo.discountValue} OFF`;
  };

  const promotions = promotionsData?.data || [];

  return (
    <AdminLayout>
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-gray-600">Manage discounts and promotional offers</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
            disabled={isImporting}
          />
          <label
            htmlFor="import-file"
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="w-4 h-4" />
            {isImporting ? 'Importing...' : 'Import'}
          </label>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <Link
            href="/admin/promotions/new"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Create Promotion
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg ${!statusFilter ? 'bg-primary text-white' : 'bg-gray-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-4 py-2 rounded-lg ${statusFilter === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-4 py-2 rounded-lg ${statusFilter === 'DRAFT' ? 'bg-gray-600 text-white' : 'bg-gray-100'}`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatusFilter('PAUSED')}
              className={`px-4 py-2 rounded-lg ${statusFilter === 'PAUSED' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}
            >
              Paused
            </button>
            <button
              onClick={() => setStatusFilter('ENDED')}
              className={`px-4 py-2 rounded-lg ${statusFilter === 'ENDED' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
            >
              Ended
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search promotions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Promotions List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading promotions...</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <p className="text-gray-600 mb-4">No promotions found</p>
          <Link
            href="/admin/promotions/new"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Create Your First Promotion
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((promo: any) => (
            <div key={promo.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                {/* Left: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{promo.name}</h3>
                    {getStatusBadge(promo.status)}
                    <span className="text-2xl font-bold text-primary">{getDiscountDisplay(promo)}</span>
                  </div>
                  
                  {promo.description && (
                    <p className="text-gray-600 mb-3">{promo.description}</p>
                  )}

                  {promo.code && (
                    <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm font-mono mb-3">
                      Code: {promo.code}
                    </div>
                  )}

                  {/* Stats */}
                  {promo.stats && (
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Redemptions:</span>
                        <span className="ml-2 font-semibold">
                          {promo.stats.totalRedemptions}
                          {promo.maxTotalRedemptions && ` / ${promo.maxTotalRedemptions}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Discount Given:</span>
                        <span className="ml-2 font-semibold">
                          £{promo.stats.totalDiscountGiven.toFixed(2)}
                          {promo.maxTotalDiscountAmount && ` / £${promo.maxTotalDiscountAmount}`}
                        </span>
                      </div>
                      {promo.stats.percentUsed > 0 && (
                        <div>
                          <span className="text-gray-600">Budget Used:</span>
                          <span className="ml-2 font-semibold">{promo.stats.percentUsed.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Budget Progress Bar */}
                  {promo.stats && promo.stats.percentUsed > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            promo.stats.percentUsed >= 90 ? 'bg-red-600' :
                            promo.stats.percentUsed >= 70 ? 'bg-yellow-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(promo.stats.percentUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/admin/promotions/${promo.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="View Stats"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/admin/promotions/${promo.id}/edit`}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  
                  {promo.status === 'DRAFT' && (
                    <button
                      onClick={() => activateMutation.mutate(promo.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Activate"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  
                  {promo.status === 'ACTIVE' && (
                    <button
                      onClick={() => pauseMutation.mutate(promo.id)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                      title="Pause"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  
                  {promo.status === 'PAUSED' && (
                    <button
                      onClick={() => activateMutation.mutate(promo.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Resume"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  
                  {(promo.status === 'ACTIVE' || promo.status === 'PAUSED') && (
                    <button
                      onClick={() => endMutation.mutate(promo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="End"
                    >
                      <StopCircle className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(promo.id, promo.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                    disabled={promo.status === 'ACTIVE'}
                  >
                    <Trash2 className={`w-4 h-4 ${promo.status === 'ACTIVE' ? 'opacity-50' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </AdminLayout>
  );
}
