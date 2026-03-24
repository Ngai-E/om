'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Settings, Store, Bell, CreditCard, Users, Shield, Mail, ShoppingCart, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { useSettingsStore } from '@/lib/store/settings-store';
import { PaymentsTab } from '@/components/admin/settings/payments-tab';
import { SystemCleanupSection } from '@/components/admin/settings/system-cleanup-section';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const { toast, success, error, hideToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { settings, updateSettings } = useSettingsStore();

  const [formData, setFormData] = useState({
    storeName: settings.storeName,
    storeEmail: settings.storeEmail,
    phoneNumber: settings.phoneNumber,
    whatsappNumber: settings.whatsappNumber || '+44 7535 316253',
    address: settings.address,
    deliveryMessage: settings.deliveryMessage,
    promoBanner: settings.promoBanner,
    aboutUs: settings.aboutUs,
    contactEmail: settings.contactEmail,
    openingHours: settings.openingHours,
    googleMapsEmbedUrl: settings.googleMapsEmbedUrl,
  });

  // Image upload configuration state
  const [imgbbApiKey, setImgbbApiKey] = useState('');
  const [cloudinaryConfig, setCloudinaryConfig] = useState({
    cloudName: '',
    apiKey: '',
    apiSecret: '',
  });

  // Sync form data with settings when they change
  useEffect(() => {
    setFormData({
      storeName: settings.storeName,
      storeEmail: settings.storeEmail,
      phoneNumber: settings.phoneNumber,
      whatsappNumber: settings.whatsappNumber || '+44 7535 316253',
      address: settings.address,
      deliveryMessage: settings.deliveryMessage,
      promoBanner: settings.promoBanner,
      aboutUs: settings.aboutUs,
      contactEmail: settings.contactEmail,
      openingHours: settings.openingHours,
      googleMapsEmbedUrl: settings.googleMapsEmbedUrl,
    });
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Update the settings store (persists to localStorage)
      updateSettings(formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      success('Settings saved successfully! Changes will appear on the homepage immediately.');
      
      // Force a small delay to ensure localStorage is updated
      setTimeout(() => {
        // Trigger a storage event to update other tabs/windows
        window.dispatchEvent(new Event('storage'));
      }, 100);
    } catch (err) {
      error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const queryClient = useQueryClient();

  // Fetch system settings from backend
  const { data: systemSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/settings');
      return data;
    },
  });

  // Toggle guest checkout
  const toggleGuestCheckout = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await apiClient.put('/settings/guest-checkout', { enabled });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      success('Guest checkout setting updated successfully!');
    },
    onError: () => {
      error('Failed to update guest checkout setting');
    },
  });

  // Toggle email notifications
  const toggleEmailNotifications = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await apiClient.put('/settings/email-notifications', { enabled });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      success('Email notifications setting updated successfully!');
    },
    onError: () => {
      error('Failed to update email notifications setting');
    },
  });

  // Toggle image upload
  const toggleImageUpload = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await apiClient.put('/settings/image-upload', { enabled });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      success('Image upload setting updated successfully!');
    },
    onError: () => {
      error('Failed to update image upload setting');
    },
  });

  // Toggle image link
  const toggleImageLink = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await apiClient.put('/settings/image-link', { enabled });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      success('Image link setting updated successfully!');
    },
    onError: () => {
      error('Failed to update image link setting');
    },
  });

  // Update image upload service
  const updateUploadService = useMutation({
    mutationFn: async (service: 'imgbb' | 'cloudinary') => {
      const { data } = await apiClient.put('/settings/image-upload-service', { service });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      success('Image upload service updated successfully!');
    },
    onError: () => {
      error('Failed to update image upload service');
    },
  });

  // Update ImgBB API key
  const updateImgbbKey = useMutation({
    mutationFn: async (apiKey: string) => {
      const { data } = await apiClient.put('/settings/imgbb-api-key', { apiKey });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      success('ImgBB API key updated successfully!');
    },
    onError: () => {
      error('Failed to update ImgBB API key');
    },
  });

  // Update Cloudinary config
  const updateCloudinaryConfig = useMutation({
    mutationFn: async (config: { cloudName: string; apiKey: string; apiSecret: string }) => {
      const { data } = await apiClient.put('/settings/cloudinary-config', config);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      success('Cloudinary configuration updated successfully!');
    },
    onError: () => {
      error('Failed to update Cloudinary configuration');
    },
  });

  const tabs = [
    { id: 'store', label: 'Store Settings', icon: Store },
    { id: 'checkout', label: 'Checkout', icon: ShoppingCart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'users', label: 'User Roles', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-700 font-medium'
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

        {/* Store Settings */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Store Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Store Name</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Store Email</label>
                  <input
                    type="email"
                    value={formData.storeEmail}
                    onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="+44 7535 316253"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +44 for UK)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Store Address</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Delivery Banner Message</label>
                  <input
                    type="text"
                    value={formData.deliveryMessage}
                    onChange={(e) => setFormData({ ...formData, deliveryMessage: e.target.value })}
                    placeholder="e.g., 🚚 Free delivery on orders over £50 in Bolton"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">This message appears at the top of your store header</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Promotional Banner</label>
                  <input
                    type="text"
                    value={formData.promoBanner || ''}
                    onChange={(e) => setFormData({ ...formData, promoBanner: e.target.value })}
                    placeholder="e.g., 🎉 Weekly Deal: 20% off all Grains & Staples"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This banner appears on your homepage
                    {formData.promoBanner && (
                      <span className="ml-2 text-green-600 font-medium">
                        ✓ Currently showing: "{formData.promoBanner.substring(0, 50)}{formData.promoBanner.length > 50 ? '...' : ''}"
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Footer Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">About Us</label>
                  <textarea
                    rows={3}
                    value={formData.aboutUs}
                    onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                    placeholder="Your trusted source for authentic African and Caribbean groceries..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">This appears in the footer About Us section</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="info@omega-groceries.co.uk"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">This appears in the footer Contact section</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Opening Hours</label>
                  <textarea
                    rows={3}
                    value={formData.openingHours}
                    onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                    placeholder="Mon-Sat: 9:00 AM - 8:00 PM&#10;Sunday: 10:00 AM - 6:00 PM"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use line breaks for each day/time range</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Google Maps Embed URL</label>
                  <textarea
                    rows={2}
                    value={formData.googleMapsEmbedUrl}
                    onChange={(e) => setFormData({ ...formData, googleMapsEmbedUrl: e.target.value })}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Get embed URL from Google Maps (Share → Embed a map)</p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Product Image Settings</h2>
              <p className="text-sm text-gray-600 mb-4">
                Control how product images can be added. Products without images will use the default Omega logo.
              </p>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Allow Image Upload</p>
                    <p className="text-sm text-gray-600">
                      Enable users to upload images from their device
                    </p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings?.allow_image_upload ?? true}
                      onChange={(e) => toggleImageUpload.mutate(e.target.checked)}
                      disabled={toggleImageUpload.isPending}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Allow Image Link</p>
                    <p className="text-sm text-gray-600">
                      Enable users to insert image URLs directly
                    </p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings?.allow_image_link ?? true}
                      onChange={(e) => toggleImageLink.mutate(e.target.checked)}
                      disabled={toggleImageLink.isPending}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </div>
                </label>

                {!systemSettings?.allow_image_upload && !systemSettings?.allow_image_link && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Warning: Both options are disabled. Users won't be able to add product images.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload Service Configuration */}
            {systemSettings?.allow_image_upload && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4">Image Upload Service</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which service to use for uploading product images.
                </p>

                {/* Service Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Upload Service</label>
                  <select
                    value={systemSettings?.image_upload_service || 'imgbb'}
                    onChange={(e) => updateUploadService.mutate(e.target.value as 'imgbb' | 'cloudinary')}
                    disabled={updateUploadService.isPending}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="imgbb">ImgBB (Free, No Account Required)</option>
                    <option value="cloudinary">Cloudinary (Requires Account)</option>
                  </select>
                </div>

                {/* ImgBB Configuration */}
                {systemSettings?.image_upload_service === 'imgbb' && (
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
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={imgbbApiKey}
                          onChange={(e) => setImgbbApiKey(e.target.value)}
                          placeholder="Enter your ImgBB API key"
                          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => {
                            if (imgbbApiKey.trim()) {
                              updateImgbbKey.mutate(imgbbApiKey.trim());
                              setImgbbApiKey('');
                            }
                          }}
                          disabled={updateImgbbKey.isPending || !imgbbApiKey.trim()}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updateImgbbKey.isPending ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                      {systemSettings?.imgbb_api_key && (
                        <p className="text-sm text-green-600 mt-2">✓ API key configured</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Cloudinary Configuration */}
                {systemSettings?.image_upload_service === 'cloudinary' && (
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
                            value={cloudinaryConfig.cloudName}
                            onChange={(e) =>
                              setCloudinaryConfig({ ...cloudinaryConfig, cloudName: e.target.value })
                            }
                            placeholder="your-cloud-name"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">API Key</label>
                          <input
                            type="text"
                            value={cloudinaryConfig.apiKey}
                            onChange={(e) =>
                              setCloudinaryConfig({ ...cloudinaryConfig, apiKey: e.target.value })
                            }
                            placeholder="123456789012345"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">API Secret</label>
                          <input
                            type="password"
                            value={cloudinaryConfig.apiSecret}
                            onChange={(e) =>
                              setCloudinaryConfig({ ...cloudinaryConfig, apiSecret: e.target.value })
                            }
                            placeholder="Enter API secret"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (
                              cloudinaryConfig.cloudName.trim() &&
                              cloudinaryConfig.apiKey.trim() &&
                              cloudinaryConfig.apiSecret.trim()
                            ) {
                              updateCloudinaryConfig.mutate(cloudinaryConfig);
                              setCloudinaryConfig({ cloudName: '', apiKey: '', apiSecret: '' });
                            }
                          }}
                          disabled={
                            updateCloudinaryConfig.isPending ||
                            !cloudinaryConfig.cloudName.trim() ||
                            !cloudinaryConfig.apiKey.trim() ||
                            !cloudinaryConfig.apiSecret.trim()
                          }
                          className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updateCloudinaryConfig.isPending ? 'Saving...' : 'Save Configuration'}
                        </button>

                        {systemSettings?.cloudinary_configured && (
                          <p className="text-sm text-green-600">✓ Cloudinary configured</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Link
                href="/"
                target="_blank"
                className="px-6 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-medium"
              >
                Preview Homepage
              </Link>
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Checkout Settings */}
        {activeTab === 'checkout' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Guest Checkout</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Allow Guest Checkout</p>
                    <p className="text-sm text-gray-600">
                      Let customers place orders without creating an account
                    </p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings?.guest_checkout_enabled ?? true}
                      onChange={(e) => toggleGuestCheckout.mutate(e.target.checked)}
                      disabled={toggleGuestCheckout.isPending}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </div>
                </label>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>When enabled:</strong> Customers can checkout by providing their email, phone, and address without registering.
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    <strong>When disabled:</strong> Customers must create an account before placing orders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Customer Email Notifications</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Order Confirmation Emails</p>
                    <p className="text-sm text-gray-600">Send email to customers when they place an order</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings?.email_notifications_enabled ?? true}
                      onChange={(e) => toggleEmailNotifications.mutate(e.target.checked)}
                      disabled={toggleEmailNotifications.isPending}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </div>
                </label>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>When enabled:</strong> Customers receive email confirmations for every order placed.
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    <strong>When disabled:</strong> No emails are sent to customers (useful for testing or to reduce email costs).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Admin Email Notifications</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">New Orders</p>
                    <p className="text-sm text-gray-600">Receive email when a new order is placed</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-gray-600">Get notified when products are running low</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Customer Messages</p>
                    <p className="text-sm text-gray-600">Receive customer inquiries and feedback</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Daily Reports</p>
                    <p className="text-sm text-gray-600">Daily summary of sales and orders</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded" />
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* Payments */}
        {activeTab === 'payments' && <PaymentsTab />}

        {/* User Roles */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Role Permissions</h2>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Admin</h3>
                  <p className="text-sm text-gray-600 mb-3">Full access to all features and settings</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">All Permissions</span>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Staff</h3>
                  <p className="text-sm text-gray-600 mb-3">Can manage orders and customers</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">View Orders</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Create Orders</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">View Customers</span>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Customer</h3>
                  <p className="text-sm text-gray-600 mb-3">Can place orders and manage their account</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Place Orders</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">View Own Orders</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Manage Profile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Security Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded" />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-gray-600">Auto-logout after 30 minutes of inactivity</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium">Login Notifications</p>
                    <p className="text-sm text-gray-600">Email alerts for new login attempts</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                </label>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Password Policy</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Minimum 8 characters</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Require uppercase and lowercase letters</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Require at least one number</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Require special characters</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <SystemCleanupSection />
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </AdminLayout>
  );
}
