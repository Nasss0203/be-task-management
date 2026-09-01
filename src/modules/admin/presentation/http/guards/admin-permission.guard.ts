import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminPermissionCode } from '../../../domain/permissions/admin-permission-code';
import { ADMIN_PERMISSIONS_KEY } from '../decorators/require-admin-permissions.decorator';

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      readonly AdminPermissionCode[]
    >(ADMIN_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    throw new ForbiddenException(
      'Admin permission enforcement is not implemented',
    );
  }
}
