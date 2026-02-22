'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Settings, Store, Bell, CreditCard, Users, Shield, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { useSettingsStore } from '@/lib/store/settings-store';
import { PaymentsTab } from '@/components/admin/settings/payments-tab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const { toast, success, error, hideToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { settings, updateSettings } = useSettingsStore();

  const [formData, setFormData] = useState({
    storeName: settings.storeName,
    storeEmail: settings.storeEmail,
    phoneNumber: settings.phoneNumber,
    address: settings.address,
    deliveryMessage: settings.deliveryMessage,
    promoBanner: settings.promoBanner,
  });

  // Sync form data with settings when they change
  useEffect(() => {
    setFormData({
      storeName: settings.storeName,
      storeEmail: settings.storeEmail,
      phoneNumber: settings.phoneNumber,
      address: settings.address,
      deliveryMessage: settings.deliveryMessage,
      promoBanner: settings.promoBanner,
    });
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Update the settings store
      updateSettings(formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      success('Settings saved successfully!');
    } catch (err) {
      error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'store', label: 'Store Settings', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'users', label: 'User Roles', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
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
                    value={formData.promoBanner}
                    onChange={(e) => setFormData({ ...formData, promoBanner: e.target.value })}
                    placeholder="e.g., 🎉 Weekly Deal: 20% off all Grains & Staples"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">This banner appears on your homepage</p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Business Hours</h2>
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-32">
                      <span className="font-medium">{day}</span>
                    </div>
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      defaultValue="18:00"
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Open</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
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

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Email Notifications</h2>
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
