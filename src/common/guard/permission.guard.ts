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
import { DataSource } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorator/require-permissions.decorator';

type WorkspaceLookup = {
  table: string;
  paramKeys: string[];
  query: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const WORKSPACE_LOOKUPS: Record<string, WorkspaceLookup> = {
  task: {
    table: 'tasks',
    paramKeys: ['taskId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM tasks WHERE id = $1',
  },
  project: {
    table: 'projects',
    paramKeys: ['projectId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM projects WHERE id = $1',
  },
  board: {
    table: 'boards',
    paramKeys: ['boardId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM boards WHERE id = $1',
  },
  sprint: {
    table: 'sprints',
    paramKeys: ['sprintId', 'sourceSprintId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM sprints WHERE id = $1',
  },
  page: {
    table: 'pages',
    paramKeys: ['pageId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM pages WHERE id = $1',
  },
  page_block: {
    table: 'page_blocks',
    paramKeys: ['blockId', 'id'],
    query: `
      SELECT p.workspace_id AS "workspaceId"
      FROM page_blocks pb
      INNER JOIN pages p ON p.id = pb.page_id
      WHERE pb.id = $1
    `,
  },
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PERMISSION_TYPES.services.FindPermissionService)
    private readonly findPermissionService: FindPermissionService,
    private readonly dataSource: DataSource,
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

    const workspaceId = await this.resolveWorkspaceId(req, requiredPermissions);

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

  private async resolveWorkspaceId(
    req: any,
    requiredPermissions: string[],
  ): Promise<string | undefined> {
    const workspaceId =
      req.params?.workspaceId ||
      req.params?.workspace_id ||
      req.body?.workspaceId ||
      req.body?.workspace_id ||
      req.body?.targetWorkspaceId ||
      req.body?.target_workspace_id ||
      req.query?.workspaceId ||
      req.query?.workspace_id ||
      req.query?.targetWorkspaceId ||
      req.query?.target_workspace_id;

    if (workspaceId) {
      return workspaceId;
    }

    for (const permission of requiredPermissions) {
      const resource = permission.split('.')[0];
      const lookup = WORKSPACE_LOOKUPS[resource];

      if (!lookup) {
        continue;
      }

      const entityId = this.pickFirstValue(req, lookup.paramKeys);

      if (!entityId || !UUID_PATTERN.test(entityId)) {
        continue;
      }

      const rows = await this.dataSource.query(lookup.query, [entityId]);
      const resolvedWorkspaceId = rows?.[0]?.workspaceId;

      if (resolvedWorkspaceId) {
        return resolvedWorkspaceId;
      }
    }

    return undefined;
  }

  private pickFirstValue(req: any, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = req.params?.[key] || req.body?.[key] || req.query?.[key];

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return undefined;
  }
}
