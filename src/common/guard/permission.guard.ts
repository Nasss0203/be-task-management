import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type FindPermissionService } from 'src/modules/permission/interfaces/services/find-all-permission.service.interface';
import { PERMISSION_TYPES } from 'src/modules/permission/interfaces/types';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { PERMISSIONS_KEY } from '../decorator/require-permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PERMISSION_TYPES.services.FindPermissionService)
    private readonly findPermissionService: FindPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();

    const user = req.user;
    const userId = user?.id;
    const systemRole = user?.systemRole;

    if (!userId) {
      throw new ForbiddenException('User not found in request');
    }

    /**
     * SUPER_ADMIN bypass all workspace permissions
     */
    if (systemRole === SystemRole.SUPER_ADMIN) {
      return true;
    }

    const workspaceId =
      req.params?.workspaceId ||
      req.params?.workspace_id ||
      req.body?.workspaceId ||
      req.body?.workspace_id ||
      req.query?.workspaceId ||
      req.query?.workspace_id;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace id not found');
    }

    const userPermissions =
      await this.findPermissionService.findPermissionsByUserAndWorkspace(
        userId,
        workspaceId,
      );

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('You do not have required permissions');
    }

    return true;
  }
}
