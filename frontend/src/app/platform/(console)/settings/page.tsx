'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '@/lib/api/platform';
import { Save, RefreshCw, Globe, Settings, Shield, DollarSign, Upload, CreditCard } from 'lucide-react';

const SETTING_LABELS: Record<string, { label: string; description: string; placeholder?: string }> = {
  platform_name: { label: 'Platform Name', description: 'The name displayed on the platform landing page and emails', placeholder: 'OMEGA Platform' },
  platform_domain: { label: 'Platform Domain', description: 'The root domain for the platform (e.g. stores.yourdomain.com)', placeholder: 'stores.yourdomain.com' },
  platform_subdomain_suffix: { label: 'Subdomain Suffix', description: 'Appended to tenant slugs for storefront URLs (e.g. slug.stores.com)', placeholder: 'stores.com' },
  platform_maintenance_mode: { label: 'Maintenance Mode', description: 'When enabled, all storefronts show a maintenance page', placeholder: 'false' },
  default_trial_days: { label: 'Default Trial Period (days)', description: 'Number of trial days for new tenant signups', placeholder: '14' },
  default_plan_id: { label: 'Default Plan ID', description: 'Package assigned to new tenants on signup', placeholder: '' },
  marketplace_enabled: { label: 'Marketplace Enabled', description: 'Allow products to appear on the marketplace', placeholder: 'false' },
  marketplace_commission_percent: { label: 'Marketplace Commission (%)', description: 'Platform commission on marketplace sales', placeholder: '10' },
  global_rate_limit: { label: 'Global Rate Limit', description: 'Max API requests per minute per tenant', placeholder: '100' },
  signup_enabled: { label: 'Signup Enabled', description: 'Allow new tenants to register via /platform/signup', placeholder: 'true' },
};

export default function PlatformSettingsPage() {
  const queryClient = useQueryClient();
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('general');

  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => platformApi.getPlatformSettings(),
  });

  const updateMutation = useMutation({
    mutationFn: (settings: Record<string, any>) => platformApi.updatePlatformSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      setEditedSettings({});
    },
  });

  // Platform fees
  const { data: feesData } = useQuery({
    queryKey: ['platform-fees'],
    queryFn: () => platformApi.getPlatformFees(),
  });

  const updateFeesMutation = useMutation({
    mutationFn: (fees: any) => platformApi.updatePlatformFees(fees),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-fees'] });
    },
  });

  // Image upload config
  const { data: imageUploadData } = useQuery({
    queryKey: ['platform-image-upload'],
    queryFn: () => platformApi.getImageUploadConfig(),
  });

  const updateImageUploadMutation = useMutation({
    mutationFn: (config: any) => platformApi.updateImageUploadConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-image-upload'] });
    },
  });

  // Stripe config
  const { data: stripeData } = useQuery({
    queryKey: ['platform-stripe'],
    queryFn: () => platformApi.getStripeConfig(),
  });

  const updateStripeMutation = useMutation({
    mutationFn: (config: any) => platformApi.updateStripeConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-stripe'] });
    },
  });

  const settings = data?.settings ?? {};
  const platformOnlyKeys = data?.platformOnlyKeys ?? [];

  const handleSave = () => {
    const parsed: Record<string, any> = {};
    for (const [key, value] of Object.entries(editedSettings)) {
      if (value === 'true') parsed[key] = true;
      else if (value === 'false') parsed[key] = false;
      else if (!isNaN(Number(value)) && value.trim() !== '') parsed[key] = Number(value);
      else parsed[key] = value;
    }
    updateMutation.mutate(parsed);
  };

  const getValue = (key: string) => {
    if (key in editedSettings) return editedSettings[key];
    const val = settings[key];
    if (val === undefined || val === null) return '';
    return typeof val === 'object' ? JSON.stringify(val) : String(val);
  };

  const hasChanges = Object.keys(editedSettings).length > 0;

  const domainKeys = ['platform_domain', 'platform_subdomain_suffix'];
  const coreKeys = platformOnlyKeys.filter((k: string) => !domainKeys.includes(k));
  const otherKeys = Object.keys(settings).filter((k: string) => !platformOnlyKeys.includes(k));

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  const renderSettingRow = (key: string) => {
    const meta = SETTING_LABELS[key];
    return (
      <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-6 py-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{meta?.label || key}</p>
          <p className="text-xs text-gray-500">{meta?.description || key}</p>
        </div>
        <input
          value={getValue(key)}
          onChange={(e) => setEditedSettings({ ...editedSettings, [key]: e.target.value })}
          className="sm:w-80 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={meta?.placeholder || '(not set)'}
        />
      </div>
    );
  };

  // Tab Components
  const FeesTab = ({ fees, updateFeesMutation }: any) => {
    const [formData, setFormData] = useState({
      platformFeePercent: fees?.platformFeePercent?.toString() || '5',
      taxPercent: fees?.taxPercent?.toString() || '0',
      minimumPayout: fees?.minimumPayout?.toString() || '50',
      payoutSchedule: fees?.payoutSchedule || 'weekly',
    });

    const handleSave = () => {
      updateFeesMutation.mutate({
        platformFeePercent: parseFloat(formData.platformFeePercent),
        taxPercent: parseFloat(formData.taxPercent),
        minimumPayout: parseFloat(formData.minimumPayout),
        payoutSchedule: formData.payoutSchedule,
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Platform Fees & Payouts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure how much you charge tenants and how payouts are processed
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Platform Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.platformFeePercent}
                  onChange={(e) => setFormData({ ...formData, platformFeePercent: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Percentage charged on each transaction</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tax (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxPercent}
                  onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Tax withheld from payouts (if applicable)</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Payout (£)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.minimumPayout}
                  onChange={(e) => setFormData({ ...formData, minimumPayout: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum balance required for payout</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payout Schedule</label>
                <select
                  value={formData.payoutSchedule}
                  onChange={(e) => setFormData({ ...formData, payoutSchedule: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">How often payouts are processed</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={updateFeesMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                {updateFeesMutation.isPending ? 'Saving...' : 'Save Fees'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ImageUploadTab = ({ config, updateImageUploadMutation }: any) => {
    const [formData, setFormData] = useState({
      service: config?.service || 'imgbb',
      imgbbApiKey: '',
      cloudinaryConfig: {
        cloudName: '',
        apiKey: '',
        apiSecret: '',
      },
    });

    const handleSave = () => {
      updateImageUploadMutation.mutate(formData);
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Image Upload Configuration</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure the image upload service used by all tenants
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Service</label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value as 'imgbb' | 'cloudinary' })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="imgbb">ImgBB (Free, No Account Required)</option>
                <option value="cloudinary">Cloudinary (Requires Account)</option>
              </select>
            </div>

            {formData.service === 'imgbb' && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <h3 className="font-medium mb-2">ImgBB Configuration</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Get your free API key from{' '}
                    <a
                      href="https://api.imgbb.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      ImgBB API
                    </a>
                  </p>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <input
                    type="password"
                    value={formData.imgbbApiKey}
                    onChange={(e) => setFormData({ ...formData, imgbbApiKey: e.target.value })}
                    placeholder="Enter your ImgBB API key"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {formData.service === 'cloudinary' && (
              <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div>
                  <h3 className="font-medium mb-2">Cloudinary Configuration</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Get your credentials from{' '}
                    <a
                      href="https://cloudinary.com/console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      Cloudinary Console
                    </a>
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Cloud Name</label>
                      <input
                        type="text"
                        value={formData.cloudinaryConfig.cloudName}
                        onChange={(e) => setFormData({
                          ...formData,
                          cloudinaryConfig: { ...formData.cloudinaryConfig, cloudName: e.target.value }
                        })}
                        placeholder="your-cloud-name"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">API Key</label>
                      <input
                        type="text"
                        value={formData.cloudinaryConfig.apiKey}
                        onChange={(e) => setFormData({
                          ...formData,
                          cloudinaryConfig: { ...formData.cloudinaryConfig, apiKey: e.target.value }
                        })}
                        placeholder="123456789012345"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">API Secret</label>
                      <input
                        type="password"
                        value={formData.cloudinaryConfig.apiSecret}
                        onChange={(e) => setFormData({
                          ...formData,
                          cloudinaryConfig: { ...formData.cloudinaryConfig, apiSecret: e.target.value }
                        })}
                        placeholder="Enter API secret"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={updateImageUploadMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                {updateImageUploadMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StripeTab = ({ config, updateStripeMutation }: any) => {
    const [formData, setFormData] = useState({
      publishableKey: config?.publishableKey || '',
      secretKey: '',
      webhookSecret: '',
      connectAccountId: config?.connectAccountId || '',
    });

    const handleSave = () => {
      updateStripeMutation.mutate(formData);
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Stripe Configuration</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure your centralized Stripe account for all tenant payments
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Publishable Key</label>
                <input
                  type="text"
                  value={formData.publishableKey}
                  onChange={(e) => setFormData({ ...formData, publishableKey: e.target.value })}
                  placeholder="pk_test_..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Public key for frontend</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Secret Key</label>
                <input
                  type="password"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  placeholder="sk_test_..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Secret key for backend</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Webhook Secret</label>
                <input
                  type="password"
                  value={formData.webhookSecret}
                  onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                  placeholder="whsec_..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">For webhook verification</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Connect Account ID</label>
                <input
                  type="text"
                  value={formData.connectAccountId}
                  onChange={(e) => setFormData({ ...formData, connectAccountId: e.target.value })}
                  placeholder="acct_..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">For platform payouts (optional)</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={updateStripeMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                {updateStripeMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Global configuration that applies across all tenants</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'fees', label: 'Fees & Payouts', icon: DollarSign },
            { id: 'image', label: 'Image Upload', icon: Upload },
            { id: 'stripe', label: 'Stripe', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">General Settings</h2>
              <p className="text-sm text-gray-500">Core platform configuration</p>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <button
                  onClick={() => setEditedSettings({})}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {updateMutation.isSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Settings saved successfully
            </div>
          )}

          {/* Domain Configuration */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Domain Configuration</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Configure the domain used for tenant storefronts. Tenant URLs follow the pattern:{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                  {'{slug}'}.{getValue('platform_subdomain_suffix') || 'stores.com'}
                </code>
              </p>
            </div>
            <div className="divide-y">
              {domainKeys.map(renderSettingRow)}
            </div>
            <div className="px-6 py-3 bg-blue-50 border-t text-xs text-blue-700">
              Tenants can also add their own custom domains (e.g. yourdomain.com) from their admin settings.
            </div>
          </div>

          {/* Core Platform Settings */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Core Platform Settings</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">These settings cannot be overridden by tenants</p>
            </div>
            <div className="divide-y">
              {coreKeys.map((key: string) => renderSettingRow(key))}
            </div>
          </div>

          {/* Tenant Defaults */}
          {otherKeys.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">Tenant Defaults</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">Default values new tenants inherit (tenants can override)</p>
              </div>
              <div className="divide-y">
                {otherKeys.map((key: string) => renderSettingRow(key))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fees & Payouts */}
      {activeTab === 'fees' && (
        <FeesTab fees={feesData?.fees} updateFeesMutation={updateFeesMutation} />
      )}

      {/* Image Upload */}
      {activeTab === 'image' && (
        <ImageUploadTab 
          config={imageUploadData?.config} 
          updateImageUploadMutation={updateImageUploadMutation} 
        />
      )}

      {/* Stripe */}
      {activeTab === 'stripe' && (
        <StripeTab 
          config={stripeData} 
          updateStripeMutation={updateStripeMutation} 
        />
      )}
    </div>
  );
}
