import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard to ensure tenant context exists on request
 * 
 * Apply to controllers or routes that require tenant context:
 * 
 * @UseGuards(TenantRequiredGuard)
 * @Controller('admin/products')
 * export class ProductsController {
 *   // All routes here require tenant context
 * }
 */
@Injectable()
export class TenantRequiredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    if (!request.tenant || !request.tenantId) {
      throw new ForbiddenException(
        'Tenant context is required for this operation. ' +
        'Ensure request includes valid tenant identification via subdomain, custom domain, or X-Tenant-Slug header.'
      );
    }
    
    return true;
  }
}
