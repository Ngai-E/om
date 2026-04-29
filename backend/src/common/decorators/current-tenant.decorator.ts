import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract tenant context from request
 * 
 * Usage:
 * @Get('products')
 * async getProducts(@CurrentTenant() tenant: TenantContext) {
 *   // tenant is guaranteed to exist if TenantRequiredGuard is applied
 * }
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);
