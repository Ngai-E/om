/**
 * Shared formatter utilities for marketplace
 */

import { MarketplaceRequest, MarketplaceOffer } from '@/lib/api/marketplace';

/**
 * Format time ago from ISO date string
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

/**
 * Format budget range for a marketplace request
 */
export function formatBudget(request: MarketplaceRequest): string | undefined {
  if (!request.budgetMin && !request.budgetMax) return undefined;
  
  const currency = request.budgetCurrency || '$';
  
  if (request.budgetMin && request.budgetMax) {
    return `${currency}${request.budgetMin.toLocaleString()} - ${currency}${request.budgetMax.toLocaleString()}`;
  }
  
  if (request.budgetMin) {
    return `${currency}${request.budgetMin.toLocaleString()}+`;
  }
  
  return `Up to ${currency}${request.budgetMax.toLocaleString()}`;
}

/**
 * Format offer price
 */
export function formatPrice(offer: MarketplaceOffer): string {
  const currency = offer.currency || '$';
  return `${currency}${offer.price.toLocaleString()}`;
}

/**
 * Format location string
 */
export function formatLocation(city?: string, countryCode?: string): string {
  if (city && countryCode) {
    return `${city}, ${countryCode}`;
  }
  if (city) return city;
  if (countryCode) return countryCode;
  return 'Location not specified';
}
