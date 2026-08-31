import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SystemRole } from 'src/modules/identity/identity.types';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { AuthorizationTarget } from 'src/modules/permission/application/types/authorization-target';
import type { PermissionCode } from 'src/modules/permission/domain/permissions/permission-code';

import { PERMISSIONS_KEY } from '../decorator/require-permissions.decorator';
import {
  WORKSPACE_CONTEXT_KEY,
  WorkspaceContextMeta,
} from '../decorator/workspace-context.decorator';
import { WorkspaceResolverService } from '../services/workspace-resolver.service';

type PermissionRequest = Parameters<WorkspaceResolverService['resolve']>[0] & {
  user?: {
    id?: string;
    systemRole?: SystemRole;
  };
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workspaceResolver: WorkspaceResolverService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionCode[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<PermissionRequest>();

    const userId = req.user?.id;
    const systemRole = req.user?.systemRole;

    if (!userId) {
      throw new ForbiddenException('User not found in request');
    }

    if (systemRole === SystemRole.SUPER_ADMIN) {
      return true;
    }

    const workspaceContext =
      this.reflector.getAllAndOverride<WorkspaceContextMeta>(
        WORKSPACE_CONTEXT_KEY,
        [context.getHandler(), context.getClass()],
      );

    const workspaceId = await this.workspaceResolver.resolve(
      req,
      workspaceContext,
      requiredPermissions.map((permission) => permission.split('.')[0]),
    );

    if (!workspaceId) {
      throw new ForbiddenException('Workspace id not found');
    }

    const target = this.resolveAuthorizationTarget(
      req,
      workspaceContext,
      workspaceId,
    );

    const allowed = await this.authorizationService.authorize({
      userId,
      permissions: requiredPermissions,
      target,
    });

    if (!allowed) {
      throw new ForbiddenException('You do not have required permissions');
    }

    return true;
  }

  private resolveAuthorizationTarget(
    req: PermissionRequest,
    workspaceContext: WorkspaceContextMeta | undefined,
    workspaceId: string,
  ): AuthorizationTarget {
    if (!workspaceContext || workspaceContext.source !== 'resource') {
      return {
        type: 'workspace',
        id: workspaceId,
      };
    }

    const resourceId = this.resolveResourceId(req, workspaceContext.key);

    if (!resourceId) {
      throw new ForbiddenException('Authorization resource id not found');
    }

    switch (workspaceContext.type) {
      case 'page':
        return {
          type: 'page',
          id: resourceId,
        };

      case 'page_block':
        return {
          type: 'pageBlock',
          id: resourceId,
        };

      default:
        return {
          type: 'workspace',
          id: workspaceId,
        };
    }
  }

  private resolveResourceId(
    req: PermissionRequest,
    key: string,
  ): string | undefined {
    const candidates = [req.params?.[key], req.body?.[key], req.query?.[key]];

    for (const candidate of candidates) {
      if (typeof candidate !== 'string') {
        continue;
      }

      const value = candidate.trim();

      if (value.length > 0) {
        return value;
      }
    }

    return undefined;
  }
}
