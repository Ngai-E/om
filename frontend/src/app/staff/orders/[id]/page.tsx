'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Clock, Package, Truck, CheckCircle, PlayCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/lib/api/staff';
import { StaffLayout } from '@/components/staff/staff-layout';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

export default function StaffOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();
  const orderId = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['staff-order', orderId],
    queryFn: () => staffApi.getOrderDetails(orderId),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => staffApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
      success('Order status updated');
    },
    onError: () => {
      error('Failed to update status');
    },
  });

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading order...</div>
        </div>
      </StaffLayout>
    );
  }

  if (!order) {
    return (
      <StaffLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Order not found</p>
        </div>
      </StaffLayout>
    );
  }

  const getActionButtons = () => {
    const buttons = [];

    if (order.status === 'RECEIVED') {
      buttons.push({
        label: '▶ Start Picking',
        icon: PlayCircle,
        color: 'bg-orange-600 hover:bg-orange-700',
        action: () => updateStatus.mutate('PICKING'),
      });
    }

    if (order.status === 'PICKING') {
      buttons.push({
        label: '✔ Mark Picked',
        icon: CheckCircle,
        color: 'bg-purple-600 hover:bg-purple-700',
        action: () => updateStatus.mutate('OUT_FOR_DELIVERY'),
      });
    }

    if (order.status === 'OUT_FOR_DELIVERY' && order.fulfillmentType === 'DELIVERY') {
      buttons.push({
        label: '🚚 Mark Delivered',
        icon: Truck,
        color: 'bg-green-600 hover:bg-green-700',
        action: () => updateStatus.mutate('DELIVERED'),
      });
    }

    if (order.status === 'OUT_FOR_DELIVERY' && order.fulfillmentType === 'COLLECTION') {
      buttons.push({
        label: '🏪 Mark Collected',
        icon: Package,
        color: 'bg-green-600 hover:bg-green-700',
        action: () => updateStatus.mutate('COLLECTED'),
      });
    }

    return buttons;
  };

  const actionButtons = getActionButtons();

  return (
    <StaffLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-lg text-gray-600">
              {order.fulfillmentType === 'DELIVERY' ? '🚚 Delivery' : '📦 Pick Up'}
            </p>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Customer Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold text-lg">
                {order.user?.firstName} {order.user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <a
                href={`tel:${order.user?.phone}`}
                className="flex items-center gap-2 font-semibold text-lg text-green-600 hover:text-green-700"
              >
                <Phone className="w-5 h-5" />
                {order.user?.phone}
              </a>
            </div>
            {order.deliverySlot && (
              <div>
                <p className="text-sm text-gray-600">Delivery Slot</p>
                <div className="flex items-center gap-2 font-semibold text-lg">
                  <Clock className="w-5 h-5 text-gray-400" />
                  {order.deliverySlot.startTime} - {order.deliverySlot.endTime}
                </div>
              </div>
            )}
            {order.address && (
              <div>
                <p className="text-sm text-gray-600">Delivery Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="font-semibold">
                    <p>{order.address.addressLine1}</p>
                    {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                    <p>{order.address.city}, {order.address.postcode}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items to Pick */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Items to Pick</h3>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-bold text-lg">{item.quantity} × {item.productName}</p>
                  <p className="text-sm text-gray-600">£{Number(item.productPrice).toFixed(2)} each</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">£{Number(item.subtotal).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xl">Total</span>
              <span className="font-bold text-2xl text-green-600">
                £{Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {actionButtons.length > 0 && (
          <div className="space-y-3">
            {actionButtons.map((button, index) => {
              const Icon = button.icon;
              return (
                <button
                  key={index}
                  onClick={button.action}
                  disabled={updateStatus.isPending}
                  className={`w-full ${button.color} text-white py-6 rounded-xl font-bold text-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-3`}
                >
                  <Icon className="w-6 h-6" />
                  {button.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Current Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-900">
            Current Status: <span className="text-blue-700">{order.status}</span>
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </StaffLayout>
  );
}
