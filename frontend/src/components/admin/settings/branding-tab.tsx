'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Palette, Type, Image, Trash2, Plus, X, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

interface HeroConfig {
  heading?: string;
  subheading?: string;
  imageUrl?: string | null;
  trustBadges?: string[];
}

interface BrandingData {
  id: string;
  tenantId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  fontHeading: string | null;
  fontBody: string | null;
  heroConfig: HeroConfig | null;
  themeKey: string | null;
  customCss: string | null;
}

interface BrandingTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function BrandingTab({ onSuccess, onError }: BrandingTabProps) {
  const queryClient = useQueryClient();

  const { data: branding, isLoading } = useQuery<BrandingData>({
    queryKey: ['admin-branding'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/admin/branding');
        return data;
      } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
  });

  // Local state
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#036637');
  const [secondaryColor, setSecondaryColor] = useState('#FF7730');
  const [accentColor, setAccentColor] = useState('');
  const [fontHeading, setFontHeading] = useState('Inter');
  const [fontBody, setFontBody] = useState('Inter');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [trustBadges, setTrustBadges] = useState<string[]>([]);
  const [newBadge, setNewBadge] = useState('');

  // Upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Sync from fetched branding
  useEffect(() => {
    if (branding) {
      setLogoUrl(branding.logoUrl || '');
      setFaviconUrl(branding.faviconUrl || '');
      setPrimaryColor(branding.primaryColor || '#036637');
      setSecondaryColor(branding.secondaryColor || '#FF7730');
      setAccentColor(branding.accentColor || '');
      setFontHeading(branding.fontHeading || 'Inter');
      setFontBody(branding.fontBody || 'Inter');
      const hc = branding.heroConfig;
      setHeroHeading(hc?.heading || '');
      setHeroSubheading(hc?.subheading || '');
      setHeroImageUrl(hc?.imageUrl || '');
      setTrustBadges(hc?.trustBadges || []);
    }
  }, [branding]);

  // Upload file helper
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post('/admin/branding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadFile(file);
      setLogoUrl(url);
      onSuccess('Logo uploaded');
    } catch {
      onError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const url = await uploadFile(file);
      setFaviconUrl(url);
      onSuccess('Favicon uploaded');
    } catch {
      onError('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const url = await uploadFile(file);
      setHeroImageUrl(url);
      onSuccess('Hero image uploaded');
    } catch {
      onError('Failed to upload hero image');
    } finally {
      setUploadingHero(false);
    }
  };

  const addBadge = () => {
    if (newBadge.trim() && trustBadges.length < 5) {
      setTrustBadges([...trustBadges, newBadge.trim()]);
      setNewBadge('');
    }
  };

  const removeBadge = (index: number) => {
    setTrustBadges(trustBadges.filter((_, i) => i !== index));
  };

  // Save mutation
  const saveBranding = useMutation({
    mutationFn: async () => {
      const payload = {
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        primaryColor,
        secondaryColor,
        accentColor: accentColor || null,
        fontHeading,
        fontBody,
        heroConfig: {
          heading: heroHeading || null,
          subheading: heroSubheading || null,
          imageUrl: heroImageUrl || null,
          trustBadges,
        },
      };
      const { data } = await apiClient.put('/admin/branding', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branding'] });
      onSuccess('Branding saved successfully! Changes will appear on your storefront.');
    },
    onError: () => {
      onError('Failed to save branding');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo & Favicon */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Image className="w-5 h-5 text-green-600" />
          Logo & Favicon
        </h2>
        <p className="text-sm text-gray-500 mb-4">Upload your store logo and favicon. Recommended: PNG or SVG with transparent background.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium mb-2">Store Logo</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-green-500 transition">
              {logoUrl ? (
                <div className="space-y-3">
                  <img src={logoUrl} alt="Logo" className="h-16 mx-auto object-contain" />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="text-xs text-green-600 hover:underline"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="space-y-2"
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">
                    {uploadingLogo ? 'Uploading...' : 'Click to upload logo'}
                  </p>
                  <p className="text-xs text-gray-400">PNG, SVG, JPG (max 2MB)</p>
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          {/* Favicon */}
          <div>
            <label className="block text-sm font-medium mb-2">Favicon</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-green-500 transition">
              {faviconUrl ? (
                <div className="space-y-3">
                  <img src={faviconUrl} alt="Favicon" className="h-10 mx-auto object-contain" />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => faviconInputRef.current?.click()}
                      className="text-xs text-green-600 hover:underline"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => setFaviconUrl('')}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={uploadingFavicon}
                  className="space-y-2"
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">
                    {uploadingFavicon ? 'Uploading...' : 'Click to upload favicon'}
                  </p>
                  <p className="text-xs text-gray-400">ICO, PNG (32x32 or 16x16)</p>
                </button>
              )}
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFaviconUpload}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Eye className="w-5 h-5 text-green-600" />
          Hero Section
        </h2>
        <p className="text-sm text-gray-500 mb-4">Configure the main banner that visitors see when they land on your store.</p>

        <div className="space-y-4">
          {/* Hero Image */}
          <div>
            <label className="block text-sm font-medium mb-2">Hero Background Image</label>
            <div className="border-2 border-dashed rounded-lg overflow-hidden hover:border-green-500 transition">
              {heroImageUrl ? (
                <div className="relative">
                  <img src={heroImageUrl} alt="Hero" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                    <div className="flex gap-3">
                      <button
                        onClick={() => heroInputRef.current?.click()}
                        className="bg-white text-gray-800 px-3 py-1.5 rounded text-sm font-medium"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => setHeroImageUrl('')}
                        className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => heroInputRef.current?.click()}
                  disabled={uploadingHero}
                  className="w-full p-8 text-center"
                >
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {uploadingHero ? 'Uploading...' : 'Upload hero background image'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 1920x600px, JPG or PNG</p>
                </button>
              )}
              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHeroUpload}
              />
            </div>
          </div>

          {/* Hero Text */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hero Heading</label>
              <input
                type="text"
                value={heroHeading}
                onChange={(e) => setHeroHeading(e.target.value)}
                placeholder="e.g. Fresh Groceries Delivered"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">Main text displayed over the hero image</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hero Subheading</label>
              <input
                type="text"
                value={heroSubheading}
                onChange={(e) => setHeroSubheading(e.target.value)}
                placeholder="e.g. Quality products. Great prices."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">Secondary text below the heading</p>
            </div>
          </div>

          {/* Trust Badges */}
          <div>
            <label className="block text-sm font-medium mb-2">Trust Badges</label>
            <p className="text-xs text-gray-400 mb-2">Short trust messages shown below the hero (max 5)</p>
            <div className="space-y-2">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-yellow-500">{['👍', '🚚', '⚡', '✅', '🛡️'][i % 5]}</span>
                  <span className="flex-1 text-sm bg-gray-50 px-3 py-1.5 rounded border">{badge}</span>
                  <button onClick={() => removeBadge(i)} className="text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {trustBadges.length < 5 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBadge()}
                    placeholder="e.g. Same-day delivery"
                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={addBadge}
                    disabled={!newBadge.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Palette className="w-5 h-5 text-green-600" />
          Brand Colors
        </h2>
        <p className="text-sm text-gray-500 mb-4">These colors are applied across your entire storefront.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Header, buttons, links</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">CTAs, highlights, accents</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor || '#000000'}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="Optional"
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Optional tertiary color</p>
          </div>
        </div>

        {/* Color Preview */}
        <div className="mt-4 p-4 rounded-lg border bg-gray-50">
          <p className="text-xs font-medium text-gray-500 mb-2">Preview</p>
          <div className="flex gap-3 items-center">
            <div className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>
              Shop Now
            </div>
            <div className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: secondaryColor }}>
              Order via WhatsApp
            </div>
            {accentColor && (
              <div className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: accentColor }}>
                Accent
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fonts */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Type className="w-5 h-5 text-green-600" />
          Typography
        </h2>
        <p className="text-sm text-gray-500 mb-4">Choose fonts for your storefront headings and body text.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Heading Font</label>
            <select
              value={fontHeading}
              onChange={(e) => setFontHeading(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Roboto">Roboto</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Lato">Lato</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Nunito">Nunito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Body Font</label>
            <select
              value={fontBody}
              onChange={(e) => setFontBody(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Roboto">Roboto</option>
              <option value="Lato">Lato</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Nunito">Nunito</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
              <option value="PT Sans">PT Sans</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={() => saveBranding.mutate()}
          disabled={saveBranding.isPending}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
        >
          {saveBranding.isPending ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}
