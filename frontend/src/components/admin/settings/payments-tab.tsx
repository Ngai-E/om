'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuthStore } from '@/lib/store/auth-store';
import { CheckCircle2 } from 'lucide-react';

type PaymentMethod = 'stripe_checkout' | 'stripe_elements';

export function PaymentsTab() {
  const { toast, success, error, hideToast } = useToast();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe_checkout');

  // Fetch current payment method
  const { data: paymentData } = useQuery({
    queryKey: ['payment-method'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/payment-method`);
      if (!response.ok) throw new Error('Failed to fetch payment method');
      return response.json();
    },
  });

  useEffect(() => {
    if (paymentData?.payment_method) {
      setSelectedMethod(paymentData.payment_method);
    }
  }, [paymentData]);

  // Update payment method mutation
  const updatePaymentMethod = useMutation({
    mutationFn: async (method: PaymentMethod) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/payment-method`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_method: method }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update payment method');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-method'] });
      success('Payment method updated successfully!');
    },
    onError: (err: any) => {
      error(err.message || 'Failed to update payment method');
    },
  });

  const handleMethodChange = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    await updatePaymentMethod.mutateAsync(method);
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-2">Stripe Payment Method</h2>
        <p className="text-sm text-gray-600 mb-6">
          Choose how customers will enter their payment information during checkout
        </p>

        <div className="space-y-4">
          {/* Stripe Checkout */}
          <button
            onClick={() => handleMethodChange('stripe_checkout')}
            disabled={updatePaymentMethod.isPending}
            className={`w-full text-left p-6 border-2 rounded-lg transition ${
              selectedMethod === 'stripe_checkout'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">Stripe Checkout</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                    Recommended
                  </span>
                  {selectedMethod === 'stripe_checkout' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Redirect customers to Stripe's secure hosted checkout page
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Fastest to implement & maintain</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Zero PCI compliance burden</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apple Pay & Google Pay enabled automatically</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mobile-optimized out of the box</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Trusted Stripe branding</span>
                  </div>
                </div>
              </div>
            </div>
          </button>

          {/* Stripe Payment Element */}
          <button
            onClick={() => handleMethodChange('stripe_elements')}
            disabled={updatePaymentMethod.isPending}
            className={`w-full text-left p-6 border-2 rounded-lg transition ${
              selectedMethod === 'stripe_elements'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">Stripe Payment Element</h3>
                  {selectedMethod === 'stripe_elements' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Embed Stripe's payment form directly on your checkout page
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Stays on your website (no redirect)</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>More control over UI/branding</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Still PCI compliant</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-600">
                    <span className="w-4 h-4 text-center">⚠️</span>
                    <span>Requires more setup & testing</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">Current Payment Method</h3>
            <p className="text-sm text-blue-700">
              {selectedMethod === 'stripe_checkout' 
                ? 'Customers will be redirected to Stripe Checkout to complete their payment.'
                : 'Customers will enter payment details directly on your checkout page using Stripe Payment Element.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stripe Configuration Info */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Stripe API Keys</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure your Stripe API keys in your environment variables:
        </p>
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg font-mono text-sm">
          <div>
            <span className="text-gray-600">Backend (.env):</span>
            <div className="mt-1 text-gray-800">
              STRIPE_SECRET_KEY=sk_test_...
            </div>
          </div>
          <div>
            <span className="text-gray-600">Frontend (.env.local):</span>
            <div className="mt-1 text-gray-800">
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Get your API keys from the{' '}
          <a 
            href="https://dashboard.stripe.com/apikeys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Stripe Dashboard
          </a>
        </p>
      </div>
    </div>
  );
}
