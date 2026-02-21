import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface StockBadgeProps {
  quantity: number;
  lowStockThreshold: number;
  isTracked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StockBadge({ quantity, lowStockThreshold, isTracked, size = 'md' }: StockBadgeProps) {
  if (!isTracked) {
    return null;
  }

  const isOutOfStock = quantity === 0;
  const isLowStock = quantity > 0 && quantity <= lowStockThreshold;
  const isInStock = quantity > lowStockThreshold;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (isOutOfStock) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 font-medium ${sizeClasses[size]}`}>
        <XCircle className={iconSizes[size]} />
        Out of Stock
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 font-medium ${sizeClasses[size]}`}>
        <AlertCircle className={iconSizes[size]} />
        Limited ({quantity} left)
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 font-medium ${sizeClasses[size]}`}>
      <CheckCircle className={iconSizes[size]} />
      In Stock
    </span>
  );
}
