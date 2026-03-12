import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConditionalLayout } from "@/components/layout/conditional-layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OMEGA Afro Caribbean Superstore",
  description: "Your one-stop shop for authentic African and Caribbean groceries",
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
  openGraph: {
    title: "OMEGA Afro Caribbean Superstore",
    description: "Your one-stop shop for authentic African and Caribbean groceries",
    url: 'https://www.omegaafro.com',
    siteName: 'OMEGA Afro Caribbean Superstore',
    images: [
      {
        url: 'https://www.omegaafro.com/omega-logo.png',
        width: 1200,
        height: 630,
        alt: 'OMEGA Afro Caribbean Superstore',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "OMEGA Afro Caribbean Superstore",
    description: "Your one-stop shop for authentic African and Caribbean groceries",
    images: ['https://www.omegaafro.com/omega-logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
