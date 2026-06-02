import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type FeatureAccessService } from 'src/modules/features/interfaces/services/feature-access.service.interface';
import { FEATURE_TYPES } from 'src/modules/features/interfaces/types';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { DataSource } from 'typeorm';
import { FEATURES_KEY } from '../decorator/require-features.decorator';

type WorkspaceLookup = {
  paramKeys: string[];
  query: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

const WORKSPACE_LOOKUPS: Record<string, WorkspaceLookup> = {
  task: {
    paramKeys: ['taskId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM tasks WHERE id = $1',
  },
  project: {
    paramKeys: ['projectId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM projects WHERE id = $1',
  },
  board: {
    paramKeys: ['boardId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM boards WHERE id = $1',
  },
  sprint: {
    paramKeys: ['sprintId', 'sourceSprintId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM sprints WHERE id = $1',
  },
  page: {
    paramKeys: ['pageId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM pages WHERE id = $1',
  },
  page_block: {
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
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(FEATURE_TYPES.services.FeatureAccessService)
    private readonly featureAccessService: FeatureAccessService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(
      FEATURES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const userId = user?.id;
    const systemRole = user?.systemRole;

    if (!userId) {
      throw new ForbiddenException('User not found in request');
    }

    if (systemRole === SystemRole.SUPER_ADMIN) {
      return true;
    }

    const workspaceId = await this.resolveWorkspaceId(req);

    if (!workspaceId) {
      throw new ForbiddenException('Workspace id not found');
    }

    await this.featureAccessService.assertUserWorkspaceMembership(
      userId,
      workspaceId,
    );

    for (const featureKey of requiredFeatures) {
      await this.featureAccessService.assertFeatureEnabledForWorkspace(
        workspaceId,
        featureKey,
      );
    }

    return true;
  }

  private async resolveWorkspaceId(req: any): Promise<string | undefined> {
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

    const pageId =
      req.params?.pageId ||
      req.params?.page_id ||
      req.body?.pageId ||
      req.body?.page_id ||
      req.query?.pageId ||
      req.query?.page_id;

    if (typeof pageId === 'string' && UUID_PATTERN.test(pageId)) {
      const rows = await this.dataSource.query(
        'SELECT workspace_id AS "workspaceId" FROM pages WHERE id = $1',
        [pageId],
      );
      const resolvedWorkspaceId = rows?.[0]?.workspaceId;

      if (resolvedWorkspaceId) {
        return resolvedWorkspaceId;
      }
    }

    for (const lookup of Object.values(WORKSPACE_LOOKUPS)) {
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
