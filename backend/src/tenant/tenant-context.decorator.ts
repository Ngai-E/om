import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract tenantId from the request.
 * Usage: @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId || null;
  },
);

/**
 * Decorator to extract full tenant object from the request.
 * Usage: @CurrentTenant() tenant: any
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant || null;
  },
);
