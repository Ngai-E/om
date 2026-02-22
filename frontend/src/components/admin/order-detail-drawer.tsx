'use client';

import { useState } from 'react';
import { X, Phone, MapPin, Copy, Package, CheckCircle, CreditCard, Truck, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export function OrderDetailDrawer({ isOpen, onClose, orderId }: OrderDetailDrawerProps) {
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => adminApi.getOrderDetails(orderId),
    enabled: isOpen && !!orderId,
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      success('Order status updated successfully');
    },
    onError: () => {
      error('Failed to update order status');
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    updateStatus.mutate({ orderId, status: newStatus });
  };

  // Verify payment mutation
  const verifyPayment = useMutation({
    mutationFn: (orderId: string) => adminApi.verifyPaymentStatus(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      
      if (data.statusMatch === false) {
        success(`Payment verified! Status updated from ${data.localStatus} to match Stripe (${data.stripeStatus})`);
      } else if (data.statusMatch === true) {
        success(`Payment verified! Status matches Stripe: ${data.stripeStatus}`);
      } else {
        success('Payment verification complete');
      }
    },
    onError: () => {
      error('Failed to verify payment status with Stripe');
    },
  });

  // Mark COD order as paid
  const markPaid = useMutation({
    mutationFn: async () => {
      // TODO: Implement mark paid API endpoint
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      success('Order marked as paid');
    },
    onError: () => {
      error('Failed to mark order as paid');
    },
  });

  const handleMarkPaid = () => {
    if (confirm('Mark this order as paid?')) {
      markPaid.mutate();
    }
  };

  // Process refund
  const processRefund = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      // TODO: Implement refund API endpoint
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      success('Refund processed successfully');
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
    },
    onError: () => {
      error('Failed to process refund');
    },
  });

  const handleRefund = () => {
    if (!refundAmount || !refundReason) {
      error('Please enter refund amount and reason');
      return;
    }
    processRefund.mutate({ amount: parseFloat(refundAmount), reason: refundReason });
  };

  const handleCopyAddress = () => {
    if (order?.address) {
      const fullAddress = `${order.address.street}, ${order.address.city}, ${order.address.postcode}`;
      navigator.clipboard.writeText(fullAddress);
      success('Address copied to clipboard');
    }
  };

  const handleCallCustomer = () => {
    if (order?.user?.phone) {
      window.location.href = `tel:${order.user.phone}`;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RECEIVED: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      PICKING: 'bg-blue-100 text-blue-700 border-blue-300',
      PACKED: 'bg-cyan-100 text-cyan-700 border-cyan-300',
      OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700 border-purple-300',
      DELIVERED: 'bg-green-100 text-green-700 border-green-300',
      READY_FOR_COLLECTION: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      COLLECTED: 'bg-teal-100 text-teal-700 border-teal-300',
      CANCELLED: 'bg-red-100 text-red-700 border-red-300',
      REFUNDED: 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      SUCCEEDED: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-500">Loading order details...</div>
          </div>
        ) : order ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  {order.payment && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.payment.status)}`}>
                      {order.payment.status}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Customer Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-semibold">
                        {order.user?.firstName} {order.user?.lastName}
                      </p>
                    </div>
                    {order.user?.phone && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <button
                          onClick={handleCallCustomer}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          <Phone className="w-4 h-4" />
                          {order.user.phone}
                        </button>
                      </div>
                    )}
                    {order.user?.email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{order.user.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery/Collection Section */}
                {order.fulfillmentType === 'DELIVERY' && order.address && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      Delivery Address
                    </h3>
                    <div className="space-y-2">
                      <p className="font-medium">{order.address.street}</p>
                      <p className="text-gray-700">
                        {order.address.city}, {order.address.postcode}
                      </p>
                      {order.deliverySlot && (
                        <p className="text-sm text-gray-600">
                          Slot: {order.deliverySlot.startTime} - {order.deliverySlot.endTime}
                        </p>
                      )}
                      <button
                        onClick={handleCopyAddress}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold mt-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Copy Address
                      </button>
                    </div>
                  </div>
                )}

                {order.fulfillmentType === 'COLLECTION' && (
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-600" />
                      Collection Order
                    </h3>
                    <p className="text-gray-700">Customer will collect from store</p>
                    {order.deliverySlot && (
                      <p className="text-sm text-gray-600 mt-2">
                        Collection time: {order.deliverySlot.startTime} - {order.deliverySlot.endTime}
                      </p>
                    )}
                  </div>
                )}

                {/* Items List */}
                <div className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-bold text-lg">Order Items</h3>
                  </div>
                  <div className="divide-y">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="p-4 flex items-start gap-4">
                        {item.product?.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{item.productName}</p>
                              <p className="text-sm text-gray-500">
                                {item.quantity} × £{parseFloat(item.productPrice).toFixed(2)}
                              </p>
                              {item.notes && (
                                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                                  <p className="text-xs text-yellow-800">
                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                    Note: {item.notes}
                                  </p>
                                </div>
                              )}
                              {item.product && !item.product.isActive && (
                                <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                                  <p className="text-xs text-red-800">
                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                    Out of stock
                                  </p>
                                </div>
                              )}
                            </div>
                            <p className="font-bold">
                              £{(item.quantity * parseFloat(item.productPrice)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="bg-gray-50 px-4 py-3 space-y-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">£{parseFloat(order.subtotal).toFixed(2)}</span>
                    </div>
                    {parseFloat(order.deliveryFee) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">£{parseFloat(order.deliveryFee).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>£{parseFloat(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information Section */}
                {order.payment && (
                  <div className={`border-2 rounded-lg p-4 ${
                    order.payment.status === 'SUCCEEDED' ? 'bg-green-50 border-green-200' :
                    order.payment.status === 'FAILED' ? 'bg-red-50 border-red-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <CreditCard className={`w-5 h-5 ${
                        order.payment.status === 'SUCCEEDED' ? 'text-green-600' :
                        order.payment.status === 'FAILED' ? 'text-red-600' :
                        'text-yellow-600'
                      }`} />
                      Payment Information
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Payment Status</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            order.payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-700' :
                            order.payment.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.payment.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                          <p className="font-semibold text-sm">
                            {order.payment.paymentMethod === 'CARD' ? '💳 Card' :
                             order.payment.paymentMethod === 'CASH_ON_DELIVERY' ? '💵 Cash on Delivery' :
                             order.payment.paymentMethod === 'PAY_IN_STORE' ? '🏪 Pay in Store' :
                             order.payment.paymentMethod}
                          </p>
                        </div>
                      </div>

                      {order.payment.amount && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Payment Amount</p>
                          <p className="font-bold text-lg">£{parseFloat(order.payment.amount).toFixed(2)}</p>
                        </div>
                      )}

                      {order.payment.stripePaymentIntentId && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Stripe Payment Intent ID</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs px-2 py-1 bg-white border rounded font-mono">
                              {order.payment.stripePaymentIntentId}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(order.payment.stripePaymentIntentId);
                                success('Payment Intent ID copied!');
                              }}
                              className="p-1 hover:bg-white rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {order.payment.stripePaymentLinkId && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Payment Link (Phone Order)</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={order.payment.stripePaymentLinkId}
                              readOnly
                              className="flex-1 text-xs px-2 py-1 bg-white border rounded font-mono"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(order.payment.stripePaymentLinkId);
                                success('Payment link copied!');
                              }}
                              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Actions */}
                    {order.payment?.paymentMethod === 'CARD' && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-sm mb-2">Payment Actions</h4>
                        
                        {/* Phone Order - Show payment link info */}
                        {order.payment.stripePaymentLinkId && order.payment.status === 'PENDING' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                            <p className="text-xs text-yellow-800">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              Send payment link to customer via SMS, email, or WhatsApp.
                            </p>
                          </div>
                        )}
                        
                        {/* Verify Payment Button - Available for ALL card payments */}
                        {(order.payment.stripePaymentIntentId || order.payment.stripeCheckoutSessionId) && order.payment.status !== 'SUCCEEDED' && (
                          <button
                            onClick={() => verifyPayment.mutate(orderId)}
                            disabled={verifyPayment.isPending}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {verifyPayment.isPending ? 'Verifying with Stripe...' : 'Verify Payment Status with Stripe'}
                          </button>
                        )}

                        {order.payment.status === 'SUCCEEDED' && (
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-xs text-green-800">
                              <CheckCircle className="w-4 h-4 inline mr-1" />
                              Payment verified and completed successfully!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {(order.notes || order.staffNotes) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">Notes</h3>
                    {order.notes && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-500">Customer Notes:</p>
                        <p className="text-gray-700">{order.notes}</p>
                      </div>
                    )}
                    {order.staffNotes && (
                      <div>
                        <p className="text-sm text-gray-500">Staff Notes:</p>
                        <p className="text-gray-700">{order.staffNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Panel - Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 space-y-3">
              <h3 className="font-bold text-lg">Actions</h3>
              
              {/* Update Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <select
                  value={selectedStatus || order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="RECEIVED">Received</option>
                  <option value="PICKING">Picking</option>
                  <option value="PACKED">Packed</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="READY_FOR_COLLECTION">Ready for Collection</option>
                  <option value="COLLECTED">Collected</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                {order.payment?.paymentMethod === 'CASH_ON_DELIVERY' && order.payment?.status === 'PENDING' && (
                  <button 
                    onClick={handleMarkPaid}
                    disabled={markPaid.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {markPaid.isPending ? 'Marking...' : 'Mark Paid'}
                  </button>
                )}
                
                {order.payment?.status === 'SUCCEEDED' && (
                  <button 
                    onClick={() => setShowRefundModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Partial Refund
                  </button>
                )}

                <button 
                  onClick={() => setShowDriverModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  Assign Driver
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Order not found</p>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Process Refund</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                  <input
                    type="number"
                    step="0.01"
                    max={parseFloat(order?.total || '0')}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Max: £{parseFloat(order?.total || '0').toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Refund *
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select reason...</option>
                  <option value="CUSTOMER_REQUEST">Customer Request</option>
                  <option value="DAMAGED_GOODS">Damaged Goods</option>
                  <option value="WRONG_ITEM">Wrong Item Delivered</option>
                  <option value="MISSING_ITEMS">Missing Items</option>
                  <option value="QUALITY_ISSUE">Quality Issue</option>
                  <option value="LATE_DELIVERY">Late Delivery</option>
                  <option value="DUPLICATE_ORDER">Duplicate Order</option>
                  <option value="OTHER">Other</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Required for audit trail
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  This action will process a refund via Stripe and cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={processRefund.isPending || !refundAmount || !refundReason}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50"
                >
                  {processRefund.isPending ? 'Processing...' : 'Process Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Assignment Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Assign Driver</h3>
              <button
                onClick={() => setShowDriverModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Driver
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a driver...</option>
                  <option value="driver1">John Smith - Available</option>
                  <option value="driver2">Sarah Johnson - Available</option>
                  <option value="driver3">Mike Williams - On Route</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <Truck className="w-4 h-4 inline mr-1" />
                  Driver will be notified via SMS and app notification.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDriverModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    success('Driver assigned successfully');
                    setShowDriverModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Assign Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
}
