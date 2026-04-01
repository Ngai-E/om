import { SetMetadata } from '@nestjs/common';
import { FEATURE_KEY, LIMIT_KEY } from '../guards/feature-gate.guard';

/**
 * Decorator to require a specific feature from the tenant's plan.
 * Usage: @RequireFeature('promotions')
 */
export const RequireFeature = (feature: string) => SetMetadata(FEATURE_KEY, feature);

/**
 * Decorator to require usage within a specific limit.
 * Usage: @RequireLimit('products') on a create endpoint.
 */
export const RequireLimit = (limit: 'orders' | 'users' | 'products') => SetMetadata(LIMIT_KEY, limit);
