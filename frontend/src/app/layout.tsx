import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { TenantProvider } from "@/components/providers/tenant-provider";
import ErrorBoundary from "@/components/error-boundary";
import { AuthNotificationContainer } from "@/components/ui/auth-notification-container";
import { BrandingApplier } from "@/components/branding/branding-applier";

export const metadata: Metadata = {
  title: "Online Store",
  description: "Shop online for quality products with fast delivery",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon-32x32.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <QueryProvider>
            <TenantProvider>
              <BrandingApplier />
              <ConditionalLayout>{children}</ConditionalLayout>
            </TenantProvider>
          </QueryProvider>
          <AuthNotificationContainer />
        </ErrorBoundary>
      </body>
    </html>
  );
}
