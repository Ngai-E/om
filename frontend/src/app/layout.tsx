import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { TenantProvider } from "@/components/providers/tenant-provider";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var c = localStorage.getItem('tenant-branding-cache');
    if (!c) return;
    var b = JSON.parse(c);
    function h2s(hex) {
      var m = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
      if (!m) return null;
      var r=parseInt(m[1],16)/255, g=parseInt(m[2],16)/255, bl=parseInt(m[3],16)/255;
      var mx=Math.max(r,g,bl), mn=Math.min(r,g,bl), h=0, s=0, l=(mx+mn)/2;
      if(mx!==mn){var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);
        if(mx===r)h=((g-bl)/d+(g<bl?6:0))/6;
        else if(mx===g)h=((bl-r)/d+2)/6;
        else h=((r-g)/d+4)/6;}
      return Math.round(h*360)+' '+Math.round(s*100)+'% '+Math.round(l*100)+'%';
    }
    var root = document.documentElement;
    if(b.primaryColor){var p=h2s(b.primaryColor);if(p){
      root.style.setProperty('--primary',p);
      root.style.setProperty('--foreground',p);
      root.style.setProperty('--card-foreground',p);
      root.style.setProperty('--popover-foreground',p);
      root.style.setProperty('--ring',p);
    }}
    if(b.secondaryColor){var s=h2s(b.secondaryColor);if(s){
      root.style.setProperty('--secondary',s);
      root.style.setProperty('--accent',s);
    }}
    if(b.accentColor){var a=h2s(b.accentColor);if(a){
      root.style.setProperty('--accent',a);
    }}
  } catch(e){}
})();
`,
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <QueryProvider>
          <TenantProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </TenantProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
