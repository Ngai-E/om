'use client';

import { StripeProvider } from '@/components/providers/stripe-provider';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StripeProvider>{children}</StripeProvider>;
}
