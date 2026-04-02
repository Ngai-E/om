'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuthStore } from '@/lib/store/auth-store';
import { CheckCircle2, CreditCard, Banknote, Store } from 'lucide-react';
import { tenantFetch } from '@/lib/tenant';

type PaymentMethod = 'stripe_checkout' | 'stripe_elements';

interface PaymentMethodsConfig {
  card: {
    enabled: boolean;
    method: PaymentMethod;
  };
  cashOnDelivery: {
    enabled: boolean;
  };
  payInStore: {
    enabled: boolean;
  };
}

export function PaymentsTab() {
  const { toast, success, error, hideToast } = useToast();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe_checkout');
  const [paymentConfig, setPaymentConfig] = useState<PaymentMethodsConfig>({
    card: { enabled: true, method: 'stripe_checkout' },
    cashOnDelivery: { enabled: true },
    payInStore: { enabled: true },
  });

  // Fetch current payment method
  const { data: paymentData } = useQuery({
    queryKey: ['payment-method'],
    queryFn: async () => {
      const response = await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/payment-method`);
      if (!response.ok) throw new Error('Failed to fetch payment method');
      return response.json();
    },
  });

  // Fetch payment methods configuration
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['payment-methods-config'],
    queryFn: async () => {
      const response = await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/payment-methods`);
      if (!response.ok) throw new Error('Failed to fetch payment methods config');
      return response.json();
    },
  });

  useEffect(() => {
    if (paymentData?.payment_method) {
      setSelectedMethod(paymentData.payment_method);
    }
  }, [paymentData]);

  useEffect(() => {
    if (paymentMethodsData?.config) {
      setPaymentConfig(paymentMethodsData.config);
    }
  }, [paymentMethodsData]);

  // Update payment method mutation
  const updatePaymentMethod = useMutation({
    mutationFn: async (method: PaymentMethod) => {
      const response = await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/payment-method`, {
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

  // Update payment methods configuration mutation
  const updatePaymentMethodsConfig = useMutation({
    mutationFn: async (config: PaymentMethodsConfig) => {
      const response = await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/payment-methods`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ config }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update payment methods config');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods-config'] });
      success('Payment methods updated successfully!');
    },
    onError: (err: any) => {
      error(err.message || 'Failed to update payment methods');
    },
  });

  const handleMethodChange = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    await updatePaymentMethod.mutateAsync(method);
  };

  const handleConfigChange = async (newConfig: PaymentMethodsConfig) => {
    setPaymentConfig(newConfig);
    await updatePaymentMethodsConfig.mutateAsync(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Payment Methods Toggle */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-2">Available Payment Methods</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enable or disable payment methods for your customers
        </p>

        <div className="space-y-4">
          {/* Card Payments */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                paymentConfig.card.enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <CreditCard className={`w-5 h-5 ${
                  paymentConfig.card.enabled ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold">Card Payments</h3>
                <p className="text-sm text-gray-600">Credit & Debit cards via Stripe</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentConfig.card.enabled}
                onChange={(e) => handleConfigChange({
                  ...paymentConfig,
                  card: { ...paymentConfig.card, enabled: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Cash on Delivery */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                paymentConfig.cashOnDelivery.enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Banknote className={`w-5 h-5 ${
                  paymentConfig.cashOnDelivery.enabled ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold">Cash on Delivery</h3>
                <p className="text-sm text-gray-600">Pay when order is delivered</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentConfig.cashOnDelivery.enabled}
                onChange={(e) => handleConfigChange({
                  ...paymentConfig,
                  cashOnDelivery: { enabled: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Pay in Store */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                paymentConfig.payInStore.enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Store className={`w-5 h-5 ${
                  paymentConfig.payInStore.enabled ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold">Pay in Store</h3>
                <p className="text-sm text-gray-600">Pay when picking up at store</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentConfig.payInStore.enabled}
                onChange={(e) => handleConfigChange({
                  ...paymentConfig,
                  payInStore: { enabled: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Payment Method Selection (only shown if card is enabled) */}
      {paymentConfig.card.enabled && (
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
      )}

      {/* Current Status */}
      {paymentConfig.card.enabled && (
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
      )}

      {/* Note about platform-managed Stripe */}
      {paymentConfig.card.enabled && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">Platform-Managed Payments</h3>
            <p className="text-sm text-blue-700">
              Stripe is configured at the platform level. All payments are processed through the platform's centralized Stripe account. You don't need to configure your own API keys.
            </p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
