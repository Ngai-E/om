/**
 * Marketplace Constants
 * Shared constants for marketplace features to ensure consistency
 */

export interface Category {
  label: string;
  value: string;
}

/**
 * Marketplace categories
 * These values must match the backend categoryKey enum
 */
export const MARKETPLACE_CATEGORIES: Category[] = [
  { label: 'Products', value: 'Products' },
  { label: 'Services', value: 'Services' },
  { label: 'Logistics', value: 'Logistics' },
  { label: 'Agriculture', value: 'Agriculture' },
  { label: 'Creative', value: 'Creative' },
];

/**
 * Get category label from value
 */
export function getCategoryLabel(value: string): string {
  const category = MARKETPLACE_CATEGORIES.find(c => c.value === value);
  return category?.label || value;
}

/**
 * Get category value from label
 */
export function getCategoryValue(label: string): string {
  const category = MARKETPLACE_CATEGORIES.find(c => c.label === label);
  return category?.value || label;
}

/**
 * Request urgency levels
 */
export const URGENCY_LEVELS = [
  { label: 'Low', value: 'LOW' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'High', value: 'HIGH' },
] as const;

/**
 * Request types
 */
export const REQUEST_TYPES = [
  { label: 'Product', value: 'PRODUCT' },
  { label: 'Service', value: 'SERVICE' },
] as const;
