'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getTenantSlug } from '@/lib/tenant';
import { tenantFetch } from '@/lib/tenant';

interface TenantBranding {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string | null;
  fontHeading?: string | null;
  fontBody?: string | null;
  heroConfig?: any;
  themeKey?: string | null;
  customCss?: string | null;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  description?: string | null;
  status: string;
  branding: TenantBranding | null;
}

interface TenantContextValue {
  tenant: TenantInfo | null;
  branding: TenantBranding | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  branding: null,
  isLoading: true,
  error: null,
});

export function useTenant() {
  return useContext(TenantContext);
}

/**
 * Convert a hex color (#RRGGBB) to HSL values string "H S% L%" for CSS custom properties.
 */
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Apply tenant branding as CSS custom properties on :root.
 */
function applyBrandingCssVars(branding: TenantBranding) {
  const root = document.documentElement;

  // Primary color → --primary, --foreground, --ring
  if (branding.primaryColor) {
    const hsl = hexToHsl(branding.primaryColor);
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--foreground', hsl);
    root.style.setProperty('--card-foreground', hsl);
    root.style.setProperty('--popover-foreground', hsl);
    root.style.setProperty('--ring', hsl);
  }

  // Secondary color → --secondary, --accent
  if (branding.secondaryColor) {
    const hsl = hexToHsl(branding.secondaryColor);
    root.style.setProperty('--secondary', hsl);
    root.style.setProperty('--accent', hsl);
  }

  // Accent color override (if different from secondary)
  if (branding.accentColor) {
    const hsl = hexToHsl(branding.accentColor);
    root.style.setProperty('--accent', hsl);
  }

  // Fonts
  if (branding.fontHeading) {
    root.style.setProperty('--font-heading', branding.fontHeading);
  }
  if (branding.fontBody) {
    root.style.setProperty('--font-body', branding.fontBody);
  }
}

/**
 * Update the favicon if tenant has one.
 */
function applyFavicon(faviconUrl: string) {
  const existing = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
  if (existing) {
    existing.href = faviconUrl;
  } else {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    document.head.appendChild(link);
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveTenant() {
      try {
        const slug = getTenantSlug();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
        const response = await tenantFetch(`${apiUrl}/storefront/store/${slug}`);

        if (!response.ok) {
          // Fallback: storefront works without branding (uses CSS defaults)
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setTenant(data);

        if (data.branding) {
          setBranding(data.branding);
          applyBrandingCssVars(data.branding);

          // Cache branding colors in localStorage for the blocking script
          // to apply on next page load (prevents color flash)
          try {
            localStorage.setItem('tenant-branding-cache', JSON.stringify({
              primaryColor: data.branding.primaryColor,
              secondaryColor: data.branding.secondaryColor,
              accentColor: data.branding.accentColor,
            }));
          } catch {
            // Ignore storage errors
          }

          if (data.branding.faviconUrl) {
            applyFavicon(data.branding.faviconUrl);
          }

          // Inject custom CSS if present
          if (data.branding.customCss) {
            const style = document.createElement('style');
            style.id = 'tenant-custom-css';
            style.textContent = data.branding.customCss;
            document.head.appendChild(style);
          }
        }

        // Update page title with tenant name
        if (data.name) {
          document.title = data.name;
        }
      } catch (err) {
        console.warn('Failed to resolve tenant branding, using defaults:', err);
        setError('Failed to resolve tenant');
      } finally {
        setIsLoading(false);
      }
    }

    resolveTenant();

    return () => {
      // Cleanup custom CSS on unmount
      const customStyle = document.getElementById('tenant-custom-css');
      if (customStyle) customStyle.remove();
    };
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, branding, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}
