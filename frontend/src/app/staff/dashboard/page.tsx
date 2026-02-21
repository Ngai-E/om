'use client';

import { useRouter } from 'next/navigation';
import { Package, Phone, ShoppingBag, ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/lib/api/staff';
import { StaffLayout } from '@/components/staff/staff-layout';

export default function StaffDashboardPage() {
  const router = useRouter();

  const { data: tasks } = useQuery({
    queryKey: ['staff-tasks'],
    queryFn: staffApi.getDashboardTasks,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const taskTiles = [
    {
      title: 'New Orders',
      count: tasks?.newOrders || 0,
      icon: Package,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      link: '/staff/orders?status=RECEIVED',
    },
    {
      title: 'Orders to Pick',
      count: tasks?.picking || 0,
      icon: ShoppingBag,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      link: '/staff/orders?status=PICKING',
    },
    {
      title: 'Orders to Pack',
      count: tasks?.packing || 0,
      icon: ClipboardList,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      link: '/staff/orders?status=PICKING',
    },
    {
      title: 'Phone Orders',
      count: null,
      icon: Phone,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      link: '/staff/phone-order',
    },
  ];

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-lg text-gray-600 mt-1">Your tasks for today</p>
        </div>

        {/* Task Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {taskTiles.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.title}
                onClick={() => router.push(task.link)}
                className={`${task.color} ${task.hoverColor} text-white rounded-2xl p-8 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-left relative overflow-hidden group`}
              >
                {/* Background Icon */}
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                  <Icon className="w-32 h-32" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-8 h-8" />
                    <h3 className="text-xl font-bold">{task.title}</h3>
                  </div>

                  {task.count !== null && (
                    <div className="text-6xl font-black mb-2">
                      {task.count}
                    </div>
                  )}

                  <div className="text-sm opacity-90 font-medium">
                    {task.count !== null ? 'Tap to view' : 'Create new order'}
                  </div>
                </div>

                {/* Badge */}
                {task.count !== null && task.count > 0 && (
                  <div className="absolute top-4 right-4 bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-md">
                    {task.count}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Info */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Quick Tips</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-900">New Orders</p>
                <p className="text-gray-600">Start picking when ready</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-900">Picking</p>
                <p className="text-gray-600">Check items and mark as picked</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-900">Packing</p>
                <p className="text-gray-600">Verify and pack for delivery</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-900">Phone Orders</p>
                <p className="text-gray-600">Take customer orders quickly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
