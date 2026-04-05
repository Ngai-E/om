import { mockOrders } from '../data/mockData';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Package, Calendar, ChevronRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';

export function OrderHistory() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (mockOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1
            className="text-3xl md:text-4xl font-black text-[#036637] mb-8"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            Order History
          </h1>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-6 bg-gray-100 rounded-full">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start shopping to see your orders here!
            </p>
            <Link to="/products">
              <Button className="bg-[#FF7730] hover:bg-[#FF6520] text-white">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-black text-[#036637] mb-2"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            Order History
          </h1>
          <p className="text-gray-600">
            View and track your past orders
          </p>
        </div>

        <div className="space-y-4">
          {mockOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Number</p>
                      <p className="font-semibold text-[#036637]">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(order.date)}
                    </div>
                  </div>
                  <Badge
                    className={`${getStatusColor(order.status)} hover:bg-opacity-90 capitalize`}
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {item.product.name}
                        </p>
                        {item.selectedVariant && (
                          <p className="text-sm text-gray-500">
                            {item.selectedVariant.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#036637]">
                          £
                          {(
                            (item.selectedVariant?.price || item.product.price) *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order Total</p>
                      <p className="text-2xl font-bold text-[#036637]">
                        £{order.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        className="flex-1 sm:flex-none border-[#036637] text-[#036637] hover:bg-[#E8F5E9]"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Link to="/products" className="flex-1 sm:flex-none">
                        <Button className="w-full bg-[#FF7730] hover:bg-[#FF6520] text-white">
                          Reorder
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-bold text-[#036637] mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you have any questions about your orders, please contact our customer service team.
          </p>
          <Button
            variant="outline"
            className="border-[#036637] text-[#036637] hover:bg-[#E8F5E9]"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
