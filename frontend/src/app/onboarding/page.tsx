'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Store, Palette, Globe, CheckCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiClient } from '@/lib/api/client';

const steps = [
  { id: 'business', title: 'Business Details', icon: Store },
  { id: 'branding', title: 'Branding', icon: Palette },
  { id: 'domain', title: 'Domain', icon: Globe },
  { id: 'complete', title: 'Complete', icon: CheckCircle },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    // Business Details
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    description: '',
    categoryKeys: [] as string[],
    
    // Branding
    primaryColor: '#0B3D2E',
    accentColor: '#E0A106',
    
    // Domain
    slug: '',
    customDomain: '',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/onboarding');
    }
  }, [isAuthenticated, router]);

  // Check if user already has a tenant
  useEffect(() => {
    if (user?.tenantId) {
      router.push('/marketplace/provider');
    }
  }, [user, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categoryKeys: prev.categoryKeys.includes(category)
        ? prev.categoryKeys.filter(c => c !== category)
        : [...prev.categoryKeys, category]
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0: // Business Details
        if (!formData.businessName.trim()) {
          setError('Business name is required');
          return false;
        }
        if (!formData.businessEmail.trim()) {
          setError('Business email is required');
          return false;
        }
        if (formData.categoryKeys.length === 0) {
          setError('Please select at least one category');
          return false;
        }
        break;
      case 1: // Branding
        // Optional step, no validation needed
        break;
      case 2: // Domain
        if (!formData.slug.trim()) {
          setError('Store slug is required');
          return false;
        }
        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(formData.slug)) {
          setError('Slug can only contain lowercase letters, numbers, and hyphens');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep < steps.length - 2) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === steps.length - 2) {
      // Submit the onboarding
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Create tenant
      const tenantResponse = await apiClient.post('/tenants', {
        name: formData.businessName,
        slug: formData.slug,
        email: formData.businessEmail,
        phone: formData.businessPhone,
        description: formData.description,
      });

      const tenantId = tenantResponse.data.id;

      // Create tenant branding
      await apiClient.post(`/tenants/${tenantId}/branding`, {
        primaryColor: formData.primaryColor,
        accentColor: formData.accentColor,
      });

      // Create marketplace provider profile
      await apiClient.post('/marketplace/providers', {
        tenantId,
        businessName: formData.businessName,
        slug: formData.slug,
        description: formData.description,
        providerType: 'BUSINESS',
        categoryKeys: formData.categoryKeys,
      });

      // Move to completion step
      setCurrentStep(steps.length - 1);

      // Redirect to provider dashboard after 2 seconds
      setTimeout(() => {
        router.push('/marketplace/provider');
      }, 2000);
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.response?.data?.message || 'Failed to create store. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const categories = ['Products', 'Services', 'Logistics', 'Agriculture', 'Creative'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-primary">Launch Your Store</h1>
          <p className="text-muted-foreground mt-1">Set up your business and start receiving customer requests</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isActive
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`text-sm mt-2 font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-lg border border-border p-8">
          {/* Business Details Step */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Tell us about your business</h2>
                <p className="text-muted-foreground mb-6">This information will be displayed on your provider profile</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Name *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="e.g., Premium Print Co"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Email *</label>
                  <input
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    placeholder="contact@business.com"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Business Phone</label>
                  <input
                    type="tel"
                    value={formData.businessPhone}
                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tell customers about your business, experience, and what makes you unique..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categories * (Select all that apply)</label>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        formData.categoryKeys.includes(category)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border hover:border-primary'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Branding Step */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Customize your brand colors</h2>
                <p className="text-muted-foreground mb-6">Choose colors that represent your brand (you can change these later)</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-20 h-12 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="flex-1 px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Used for headers, buttons, and key elements</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Accent Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="w-20 h-12 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="flex-1 px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Used for highlights and call-to-action elements</p>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-6 mt-8">
                <p className="text-sm font-medium mb-4">Preview</p>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div 
                    className="h-12 rounded-lg mb-4 flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Primary Color
                  </div>
                  <div 
                    className="h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    Accent Color
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Domain Step */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Choose your store URL</h2>
                <p className="text-muted-foreground mb-6">This will be your unique store address on our platform</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Store Slug *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="your-store-name"
                    className="flex-1 px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-muted-foreground">.stores.xxx</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Your store will be accessible at: <span className="font-medium">{formData.slug || 'your-store-name'}.stores.xxx</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Custom Domain (Optional)</label>
                <input
                  type="text"
                  value={formData.customDomain}
                  onChange={(e) => handleInputChange('customDomain', e.target.value)}
                  placeholder="www.yourdomain.com"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-sm text-muted-foreground mt-2">You can add a custom domain later in settings</p>
              </div>
            </div>
          )}

          {/* Completion Step */}
          {currentStep === 3 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Your store is ready! 🎉</h2>
              <p className="text-muted-foreground mb-8">
                You can now start bidding on customer requests and managing your provider profile.
              </p>
              <div className="inline-flex items-center gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Redirecting to your dashboard...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < steps.length - 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                onClick={handleBack}
                disabled={currentStep === 0 || isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Store...
                  </>
                ) : currentStep === steps.length - 2 ? (
                  <>
                    Complete Setup
                    <CheckCircle className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
