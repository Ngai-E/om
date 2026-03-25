import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins bypass all permission checks
    if (user.role === 'ADMIN') {
      return true;
    }

    // Staff must have the required permissions
    if (user.role === 'STAFF') {
      const userPermissions = user.permissions || [];
      
      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `This action requires one of the following permissions: ${requiredPermissions.join(', ')}`
        );
      }

      return true;
    }

    // Other roles (CUSTOMER, etc.) are denied
    throw new ForbiddenException('Insufficient permissions');
  }
}
