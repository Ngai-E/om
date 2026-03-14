'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Printer } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // You can verify the payment with your backend here
    // For now, we'll just show success
    const storedOrderNumber = sessionStorage.getItem('orderNumber');
    if (storedOrderNumber) {
      setOrderNumber(storedOrderNumber);
      sessionStorage.removeItem('orderNumber');
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-8">
          Thank you for your order. Your payment has been processed successfully.
        </p>

        {/* Order Details */}
        {orderNumber && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-1">
              <Package className="w-4 h-4" />
              <span>Order Number</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{orderNumber}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• You'll receive an email confirmation shortly</li>
            <li>• We'll notify you when your order is being prepared</li>
            <li>• Track your order status in your account</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handlePrint}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition print:hidden"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <Link
            href="/orders"
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition print:hidden"
          >
            View My Orders
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/products"
            className="w-full inline-block px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition print:hidden"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
