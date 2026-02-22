'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/use-toast';
import { SuccessToast } from '@/components/ui/success-toast';
import { ErrorToast } from '@/components/ui/error-toast';
import { useCreateAddress } from '@/lib/hooks/use-account';
import { useCheckPostcode } from '@/lib/hooks/use-delivery';

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  county: z.string().min(1, 'County is required'),
  postcode: z.string().min(5, 'Valid postcode is required'),
  isDefault: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function NewAddressPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast, success, error, hideToast } = useToast();
  const createAddress = useCreateAddress();
  const [postcode, setPostcode] = useState('');
  const { data: postcodeData, isLoading: checkingPostcode } = useCheckPostcode(postcode);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const watchedPostcode = watch('postcode');

  const onSubmit = async (data: AddressFormData) => {
    try {
      await createAddress.mutateAsync(data);
      success('Address saved successfully!');
      // Navigate back after a short delay
      setTimeout(() => {
        router.push('/account/addresses');
      }, 1000);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save address');
      console.error('Create address error:', err);
    }
  };

  const handlePostcodeBlur = () => {
    if (watchedPostcode && watchedPostcode.length >= 5) {
      setPostcode(watchedPostcode);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/account/addresses"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Addresses
        </Link>

        <h1 className="text-3xl font-bold mb-8">Add New Address</h1>

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Label */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Address Label *
              </label>
              <input
                {...register('label')}
                type="text"
                placeholder="e.g. Home, Work, Mum's House"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.label && (
                <p className="text-sm text-destructive mt-1">{errors.label.message}</p>
              )}
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Address Line 1 *
              </label>
              <input
                {...register('line1')}
                type="text"
                placeholder="House number and street name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.line1 && (
                <p className="text-sm text-destructive mt-1">{errors.line1.message}</p>
              )}
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Address Line 2
              </label>
              <input
                {...register('line2')}
                type="text"
                placeholder="Apartment, suite, unit, etc. (optional)"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium mb-2">
                City *
              </label>
              <input
                {...register('city')}
                type="text"
                placeholder="e.g. London"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
              )}
            </div>

            {/* County */}
            <div>
              <label className="block text-sm font-medium mb-2">
                County *
              </label>
              <input
                {...register('county')}
                type="text"
                placeholder="e.g. Greater London"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.county && (
                <p className="text-sm text-destructive mt-1">{errors.county.message}</p>
              )}
            </div>

            {/* Postcode */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Postcode *
              </label>
              <input
                {...register('postcode')}
                type="text"
                placeholder="e.g. SW1A 1AA"
                onBlur={handlePostcodeBlur}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.postcode && (
                <p className="text-sm text-destructive mt-1">{errors.postcode.message}</p>
              )}
              {checkingPostcode && (
                <p className="text-sm text-muted-foreground mt-1">Checking postcode...</p>
              )}
              {postcodeData?.zone && (
                <div className="mt-2 p-3 bg-primary/5 border border-primary rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    ✓ Delivery available in {postcodeData.zone.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Delivery fee: £{parseFloat(postcodeData.zone.deliveryFee).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Default Address */}
            <div className="flex items-center gap-2">
              <input
                {...register('isDefault')}
                type="checkbox"
                id="isDefault"
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isDefault" className="text-sm font-medium">
                Set as default address
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createAddress.isPending}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {createAddress.isPending ? 'Saving...' : 'Save Address'}
              </button>
              <Link
                href="/account/addresses"
                className="px-6 py-3 border rounded-lg hover:bg-muted transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast?.type === 'success' && (
        <SuccessToast
          title={toast.title}
          message={toast.message}
          onClose={hideToast}
        />
      )}
      {toast?.type === 'error' && (
        <ErrorToast
          title={toast.title}
          message={toast.message}
          errors={toast.errors}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
