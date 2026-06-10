import { Injectable } from '@nestjs/common';
import {
  WorkspaceContextMeta,
  WorkspaceResourceType,
} from 'src/common/decorator/workspace-context.decorator';
import { DataSource } from 'typeorm';

type WorkspaceLookup = {
  paramKeys: string[];
  query: string;
};

type WorkspaceLookupRow = {
  workspaceId?: string;
};

type RequestWithWorkspaceContext = {
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  workspaceId?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const WORKSPACE_LOOKUPS: Record<WorkspaceResourceType, WorkspaceLookup> = {
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
  attachment: {
    paramKeys: ['attachmentId', 'id'],
    query: 'SELECT workspace_id AS "workspaceId" FROM attachments WHERE id = $1',
  },
};

@Injectable()
export class WorkspaceResolverService {
  constructor(private readonly dataSource: DataSource) {}

  async resolve(
    req: RequestWithWorkspaceContext,
    meta?: WorkspaceContextMeta,
    resourceHints?: string[],
  ): Promise<string | undefined> {
    if (meta) {
      const workspaceId = await this.resolveFromMeta(req, meta);

      if (workspaceId) {
        req.workspaceId = workspaceId;
      }

      return workspaceId;
    }

    if (req.workspaceId) {
      return req.workspaceId;
    }

    const workspaceId = await this.resolveFromRequest(req, resourceHints);

    if (workspaceId) {
      req.workspaceId = workspaceId;
    }

    return workspaceId;
  }

  private async resolveFromMeta(
    req: RequestWithWorkspaceContext,
    meta: WorkspaceContextMeta,
  ): Promise<string | undefined> {
    if (meta.source === 'resource') {
      return this.resolveFromResource(req, meta.type, [meta.key]);
    }

    const source = meta.source === 'param' ? req.params : req[meta.source];

    return this.normalizeWorkspaceId(source?.[meta.key]);
  }

  private async resolveFromRequest(
    req: RequestWithWorkspaceContext,
    resourceHints?: string[],
  ): Promise<string | undefined> {
    const workspaceId = this.pickFirstValue(req, [
      'workspaceId',
      'workspace_id',
      'targetWorkspaceId',
      'target_workspace_id',
    ]);

    if (workspaceId) {
      return this.normalizeWorkspaceId(workspaceId);
    }

    const lookupEntries = this.getLookupEntries(resourceHints);

    for (const [resourceType, lookup] of lookupEntries) {
      const resolvedWorkspaceId = await this.resolveFromResource(
        req,
        resourceType,
        lookup.paramKeys,
      );

      if (resolvedWorkspaceId) {
        return resolvedWorkspaceId;
      }
    }

    return undefined;
  }

  private getLookupEntries(
    resourceHints?: string[],
  ): Array<[WorkspaceResourceType, WorkspaceLookup]> {
    const validHints = (resourceHints ?? []).filter(
      (hint): hint is WorkspaceResourceType => hint in WORKSPACE_LOOKUPS,
    );

    if (validHints.length === 0) {
      return Object.entries(WORKSPACE_LOOKUPS) as Array<
        [WorkspaceResourceType, WorkspaceLookup]
      >;
    }

    return validHints.map((hint) => [hint, WORKSPACE_LOOKUPS[hint]]);
  }

  private async resolveFromResource(
    req: RequestWithWorkspaceContext,
    resourceType: WorkspaceResourceType,
    keys: string[],
  ): Promise<string | undefined> {
    const lookup = WORKSPACE_LOOKUPS[resourceType];
    const entityId = this.pickFirstValue(req, keys);

    if (!entityId || !UUID_PATTERN.test(entityId)) {
      return undefined;
    }

    const rows = await this.dataSource.query<WorkspaceLookupRow[]>(
      lookup.query,
      [entityId],
    );

    return rows?.[0]?.workspaceId;
  }

  private pickFirstValue(
    req: RequestWithWorkspaceContext,
    keys: string[],
  ): string | undefined {
    for (const key of keys) {
      const value =
        this.normalizeString(req.params?.[key]) ||
        this.normalizeString(req.body?.[key]) ||
        this.normalizeString(req.query?.[key]);

      if (value) {
        return value;
      }
    }

    return undefined;
  }

  private normalizeString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalizedValue = value.trim();
    return normalizedValue || undefined;
  }

  private normalizeWorkspaceId(value: unknown): string | undefined {
    const normalizedValue = this.normalizeString(value);

    if (!normalizedValue || !UUID_PATTERN.test(normalizedValue)) {
      return undefined;
    }

    return normalizedValue;
  }
}
