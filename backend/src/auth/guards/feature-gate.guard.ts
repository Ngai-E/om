import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicensingService } from '../../licensing/licensing.service';

export const FEATURE_KEY = 'required_feature';
export const LIMIT_KEY = 'required_limit';

/**
 * Guard that checks if the tenant's license includes a required feature.
 * Usage: @RequireFeature('promotions') on a controller method.
 */
@Injectable()
export class FeatureGateGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private licensingService: LicensingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No feature requirement → allow
    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    // No tenant context → allow (platform-level routes)
    if (!tenantId) return true;

    const hasFeature = await this.licensingService.checkTenantFeature(tenantId, requiredFeature);

    if (!hasFeature) {
      throw new ForbiddenException(
        `Your plan does not include the "${requiredFeature}" feature. Please upgrade your subscription.`,
      );
    }

    return true;
  }
}

/**
 * Guard that checks if the tenant is within a usage limit before allowing the action.
 * Usage: @RequireLimit('products') on a create endpoint.
 */
@Injectable()
export class LimitGateGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private licensingService: LicensingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredLimit = this.reflector.getAllAndOverride<'orders' | 'users' | 'products'>(
      LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No limit requirement → allow
    if (!requiredLimit) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    // No tenant context → allow
    if (!tenantId) return true;

    const check = await this.licensingService.checkTenantLimit(tenantId, requiredLimit);

    if (!check.allowed) {
      throw new ForbiddenException(
        check.reason || `You have reached your ${requiredLimit} limit. Please upgrade your subscription.`,
      );
    }

    return true;
  }
}
