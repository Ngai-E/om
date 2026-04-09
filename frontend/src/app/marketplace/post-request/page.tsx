'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/marketplace/top-nav';
import { MobileNav } from '@/components/marketplace/mobile-nav';
import { useAuthStore } from '@/lib/store/auth-store';
import { marketplaceRequestsApi } from '@/lib/api/marketplace';
import { MARKETPLACE_CATEGORIES, URGENCY_LEVELS } from '@/lib/constants/marketplace';

const steps = ['Details', 'Budget & Urgency', 'Location', 'Review'];

interface FormData {
  title: string;
  category: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  urgency: string;
  city: string;
  countryCode: string;
  radius: string;
  images: string[];
}

export default function PostRequestPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    urgency: 'NORMAL',
    city: '',
    countryCode: 'US',
    radius: '10',
    images: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/marketplace/post-request');
    }
  }, [isAuthenticated, router]);

  const handleNext = async () => {
    setError(null);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit request to API
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.category || !formData.description) {
        throw new Error('Please fill in all required fields');
      }

      // Parse budget values
      const budgetMin = formData.budgetMin ? parseFloat(formData.budgetMin) : undefined;
      const budgetMax = formData.budgetMax ? parseFloat(formData.budgetMax) : undefined;

      // Determine request type based on category value
      // Products category = PRODUCT, all others = SERVICE
      const requestType: 'PRODUCT' | 'SERVICE' = formData.category === 'Products' ? 'PRODUCT' : 'SERVICE';

      // Create request
      const request = await marketplaceRequestsApi.createRequest({
        requestType,
        title: formData.title,
        description: formData.description,
        categoryKey: formData.category,
        budgetMin,
        budgetMax,
        currencyCode: 'USD',
        urgency: formData.urgency,
        city: formData.city || undefined,
        countryCode: formData.countryCode || undefined,
      });

      // Redirect to the created request
      router.push(`/marketplace/requests/${request.id}`);
    } catch (err: any) {
      console.error('Failed to create request:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create request. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <TopNav />
      
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold mb-2">Post a request</h1>
          <p className="text-muted-foreground">Tell us what you need and get competitive offers</p>
        </div>

        {/* Progress stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      index <= currentStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1 hidden md:block">{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="e.g., Need custom wooden furniture for office"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a category</option>
                  {MARKETPLACE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Describe what you need in detail..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Budget ($)</label>
                  <input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => updateFormData('budgetMin', e.target.value)}
                    placeholder="e.g., 2000"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Budget ($)</label>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => updateFormData('budgetMax', e.target.value)}
                    placeholder="e.g., 3000"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Urgency</label>
                <div className="grid grid-cols-3 gap-3">
                  {URGENCY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => updateFormData('urgency', level.value)}
                      className={`px-4 py-3 rounded-lg border font-medium ${
                        formData.urgency === level.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Images (optional)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 10MB (max 5 images)
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="e.g., San Francisco"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.countryCode}
                    onChange={(e) => updateFormData('countryCode', e.target.value)}
                    placeholder="e.g., US"
                    maxLength={2}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Search radius: {formData.radius} miles
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={formData.radius}
                  onChange={(e) => updateFormData('radius', e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5 miles</span>
                  <span>50 miles</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Request Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Title:</span>
                    <span className="font-medium">{formData.title || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium capitalize">{formData.category || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">
                      {formData.budgetMin || formData.budgetMax
                        ? `$${formData.budgetMin || '0'} - $${formData.budgetMax || 'unlimited'}`
                        : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Urgency:</span>
                    <span className="font-medium">
                      {URGENCY_LEVELS.find(l => l.value === formData.urgency)?.label || formData.urgency}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">
                      {formData.city || formData.countryCode
                        ? `${formData.city || ''} ${formData.countryCode || ''}`.trim()
                        : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  By posting this request, you agree to our terms of service and privacy policy.
                  Your request will be visible to verified providers in your area.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                {currentStep === steps.length - 1 ? 'Publish request' : 'Continue'}
                {currentStep < steps.length - 1 && <ArrowRight className="h-4 w-4" />}
              </>
            )}
          </button>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
