/**
 * Add cache-busting parameter to image URL
 * This ensures images are refreshed when products are updated
 */
export function getImageUrl(url: string, timestamp?: string | Date | number): string {
  if (!url) return '';
  
  // If URL already has query params, append with &
  const separator = url.includes('?') ? '&' : '?';
  
  // Use provided timestamp or current time
  const t = timestamp 
    ? (timestamp instanceof Date ? timestamp.getTime() : timestamp)
    : Date.now();
  
  return `${url}${separator}t=${t}`;
}

/**
 * Get product image URL with cache-busting
 */
export function getProductImageUrl(product: any): string {
  const imageUrl = product.images?.[0]?.url;
  if (!imageUrl) return '';
  
  // Use product's updatedAt timestamp for cache-busting
  return getImageUrl(imageUrl, product.updatedAt);
}
