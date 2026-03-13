'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Truck, Clock, MapPin, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { DeliveryZonesTab } from '@/components/admin/delivery/delivery-zones-tab';
import { DeliverySlotsTab } from '@/components/admin/delivery/delivery-slots-tab';
import { DeliveryTemplatesTab } from '@/components/admin/delivery/delivery-templates-tab';
import { DriversTab } from '@/components/admin/delivery/drivers-tab';

type TabType = 'zones' | 'slots' | 'templates' | 'drivers';

export default function DeliveryManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('zones');

  const tabs = [
    { id: 'zones' as TabType, label: 'Delivery Zones', icon: MapPin },
    { id: 'slots' as TabType, label: 'Time Slots', icon: Clock },
    { id: 'templates' as TabType, label: 'Weekly Templates', icon: Clock },
    { id: 'drivers' as TabType, label: 'Drivers', icon: Users, badge: 'Coming Soon' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-green-600" />
            Delivery Management
          </h1>
          <p className="text-gray-600 mt-1">Manage delivery zones, time slots, and drivers</p>
        </div>

        {/* Tabs */}
        <div className="bg-white border rounded-lg">
          <div className="border-b">
            <div className="flex gap-1 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition relative ${
                      activeTab === tab.id
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.badge && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'zones' && <DeliveryZonesTab />}
            {activeTab === 'slots' && <DeliverySlotsTab />}
            {activeTab === 'templates' && <DeliveryTemplatesTab />}
            {activeTab === 'drivers' && <DriversTab />}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
