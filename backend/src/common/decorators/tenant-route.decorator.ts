import { UseGuards } from '@nestjs/common';
import { TenantRequiredGuard } from '../guards/tenant-required.guard';

/**
 * Decorator that enforces tenant context on a route.
 * Combines @UseGuards(TenantRequiredGuard) into a single decorator.
 * 
 * Usage:
 * @TenantRoute()
 * @Controller('products')
 * export class ProductsController { ... }
 */
export const TenantRoute = () => UseGuards(TenantRequiredGuard);
