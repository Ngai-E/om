'use client';

import { useEffect } from 'react';

interface BrandingData {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export function BrandingApplier() {
  useEffect(() => {
    // Apply tenant branding on client side only
    applyBranding();
  }, []);

  return null;
}

function applyBranding() {
  try {
    const cached = localStorage.getItem('tenant-branding-cache');
    if (!cached) return;

    const branding: BrandingData = JSON.parse(cached);
    
    // Helper function to convert hex to HSL
    function hexToHsl(hex: string): string | null {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return null;
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        if (max === r) {
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        } else if (max === g) {
          h = ((b - r) / d + 2) / 6;
        } else {
          h = ((r - g) / d + 4) / 6;
        }
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    }

    const root = document.documentElement;
    
    // Apply primary color
    if (branding.primaryColor) {
      const hsl = hexToHsl(branding.primaryColor);
      if (hsl) {
        root.style.setProperty('--primary', hsl);
        root.style.setProperty('--foreground', hsl);
        root.style.setProperty('--card-foreground', hsl);
        root.style.setProperty('--popover-foreground', hsl);
        root.style.setProperty('--ring', hsl);
      }
    }
    
    // Apply secondary color
    if (branding.secondaryColor) {
      const hsl = hexToHsl(branding.secondaryColor);
      if (hsl) {
        root.style.setProperty('--secondary', hsl);
        root.style.setProperty('--accent', hsl);
      }
    }
    
    // Apply accent color
    if (branding.accentColor) {
      const hsl = hexToHsl(branding.accentColor);
      if (hsl) {
        root.style.setProperty('--accent', hsl);
      }
    }
  } catch (error) {
    console.warn('Failed to apply branding:', error);
  }
}
