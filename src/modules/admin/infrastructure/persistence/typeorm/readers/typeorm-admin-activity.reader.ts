import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';

import type {
  AdminActivityItem,
  AdminActivityReader,
  ListAdminActivitiesInput,
  ListAdminActivitiesResult,
} from '../../../../application/ports/admin-activity-reader.port';

interface ActivityRawRow {
  id: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  field: string | null;
  isSystem: boolean;
  createdAt: Date | string;
  actorId: string | null;
  actorUsername: string | null;
  actorEmail: string | null;
  workspaceId: string;
  workspaceName: string | null;
  pageId: string | null;
  pageTitle: string | null;
}

const ACTIVITIES_FROM = `
  FROM activities activity
  LEFT JOIN users actor ON actor.id = activity.actor_id
  LEFT JOIN workspaces workspace ON workspace.id = activity.workspace_id
  LEFT JOIN pages page ON page.id = activity.page_id
  WHERE activity.created_at >= $1
    AND activity.created_at <= $2
    AND ($3::uuid IS NULL OR activity.workspace_id = $3)
    AND ($4::uuid IS NULL OR activity.actor_id = $4)
    AND (
      $5::text IS NULL
      OR actor.email ILIKE '%' || $5 || '%'
      OR actor.username ILIKE '%' || $5 || '%'
      OR workspace.name ILIKE '%' || $5 || '%'
    )
    AND ($6::text IS NULL OR activity.entity_type::text = $6)
    AND ($7::text IS NULL OR activity.action::text = $7)
`;

@Injectable()
export class TypeOrmAdminActivityReader implements AdminActivityReader {
  constructor(private readonly dataSource: DataSource) {}

  async listActivities(
    input: ListAdminActivitiesInput,
  ): Promise<ListAdminActivitiesResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;
    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;
    const filters = [
      input.from,
      input.to,
      input.workspaceId ?? null,
      input.actorId ?? null,
      input.search?.trim() || null,
      input.entityType ?? null,
      input.action ?? null,
    ];

    const rows = await this.dataSource.query<ActivityRawRow[]>(
      `
        SELECT
          activity.id AS "id",
          activity.action AS "action",
          activity.entity_type AS "entityType",
          activity.entity_id AS "entityId",
          activity.field AS "field",
          activity.is_system AS "isSystem",
          activity.created_at AS "createdAt",
          actor.id AS "actorId",
          actor.username AS "actorUsername",
          actor.email AS "actorEmail",
          activity.workspace_id AS "workspaceId",
          workspace.name AS "workspaceName",
          activity.page_id AS "pageId",
          page.title AS "pageTitle"
        ${ACTIVITIES_FROM}
        ORDER BY activity.created_at DESC, activity.id
        LIMIT $8
        OFFSET $9
      `,
      [...filters, limit, (page - 1) * limit],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(`SELECT COUNT(*) AS total ${ACTIVITIES_FROM}`, filters);

    return {
      items: rows.map((row) => this.toItem(row)),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  private toItem(row: ActivityRawRow): AdminActivityItem {
    return {
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      field: row.field,
      isSystem: row.isSystem,
      createdAt: new Date(row.createdAt),
      actor: row.actorId
        ? {
            id: row.actorId,
            username: row.actorUsername ?? '',
            email: row.actorEmail ?? '',
          }
        : null,
      workspace: { id: row.workspaceId, name: row.workspaceName },
      page: row.pageId ? { id: row.pageId, title: row.pageTitle } : null,
    };
  }
}
