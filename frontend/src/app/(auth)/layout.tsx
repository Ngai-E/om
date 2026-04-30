'use client';

import { useEffect, useState } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPlatform, setIsPlatform] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      const hostname = window.location.hostname;
      
      // Platform detection
      const platformDomains = ['viralsocialmediabooster.com', 'www.viralsocialmediabooster.com', 'app.viralsocialmediabooster.com', 'market.viralsocialmediabooster.com', 'console.viralsocialmediabooster.com'];
      const isPlatformDomain = platformDomains.includes(hostname) || 
                               hostname.split('.')[0] === 'app' ||
                               port === '3000';
      
      setIsPlatform(isPlatformDomain);
    }
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 ${
      isPlatform 
        ? 'bg-gradient-to-br from-blue-50 via-white to-indigo-50' 
        : 'bg-gradient-to-br from-primary/10 via-background to-secondary/10'
    }`}>
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
