import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IUserJwtPayload } from 'src/modules/identity/identity-jwt.types';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminAuthorizationService } from '../../../application/services/admin-authorization.service';
import type { AdminPermissionCode } from '../../../domain/permissions/admin-permission-code';
import { AdminActor } from '../../../domain/value-objects/admin-actor.vo';
import { ADMIN_PERMISSIONS_KEY } from '../decorators/require-admin-permissions.decorator';

type AdminAuthenticatedRequest = {
  user?: Partial<IUserJwtPayload>;
};

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ADMIN_TYPES.services.AdminAuthorizationService)
    private readonly adminAuthorizationService: AdminAuthorizationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      readonly AdminPermissionCode[]
    >(ADMIN_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AdminAuthenticatedRequest>();

    const userId = request.user?.id ?? request.user?.sub;
    const systemRole = request.user?.systemRole;

    if (!userId || !systemRole) {
      throw new ForbiddenException('Admin actor not found');
    }

    const actor = new AdminActor({
      userId,
      systemRole,
    });

    const hasAllPermissions = requiredPermissions.every((permission) =>
      this.adminAuthorizationService.hasPermission(actor, permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Missing required admin permissions');
    }

    return true;
  }
}
