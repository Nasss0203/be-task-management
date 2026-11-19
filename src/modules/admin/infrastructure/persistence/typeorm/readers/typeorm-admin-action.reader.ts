import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

import type {
  AdminActionItem,
  AdminActionReader,
  ListAdminActionsInput,
  ListAdminActionsResult,
} from '../../../../application/ports/admin-action-reader.port';
import type {
  AdminAction,
  AdminActionChanges,
  AdminActionTargetType,
} from '../../../../domain/audit/admin-action';

interface AdminActionRawRow {
  id: string;
  action: AdminAction;
  targetType: AdminActionTargetType;
  targetId: string | null;
  targetLabel: string | null;
  changes: AdminActionChanges;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date | string;
  actorId: string | null;
  actorUsername: string | null;
  actorEmail: string | null;
  actorSystemRole: SystemRole | null;
}

const ACTIONS_FROM = `
  FROM admin_actions admin_action
  LEFT JOIN users acting_admin ON acting_admin.id = admin_action.actor_user_id
  LEFT JOIN users target_user
    ON admin_action.target_type = 'USER'
    AND target_user.id = admin_action.target_id
  LEFT JOIN billing_plans target_plan
    ON admin_action.target_type = 'BILLING_PLAN'
    AND target_plan.id = admin_action.target_id
  LEFT JOIN template_categories target_category
    ON admin_action.target_type = 'TEMPLATE_CATEGORY'
    AND target_category.id = admin_action.target_id
  LEFT JOIN published_sites target_site
    ON admin_action.target_type = 'PUBLISHED_SITE'
    AND target_site.id = admin_action.target_id
  WHERE admin_action.created_at >= $1
    AND admin_action.created_at <= $2
    AND ($3::uuid IS NULL OR admin_action.actor_user_id = $3)
    AND ($4::text IS NULL OR admin_action.target_type = $4)
    AND ($5::uuid IS NULL OR admin_action.target_id = $5)
    AND ($6::text IS NULL OR admin_action.action = $6)
    AND (
      $7::text IS NULL
      OR acting_admin.email ILIKE '%' || $7 || '%'
      OR acting_admin.username ILIKE '%' || $7 || '%'
    )
`;

@Injectable()
export class TypeOrmAdminActionReader implements AdminActionReader {
  constructor(private readonly dataSource: DataSource) {}

  async listActions(
    input: ListAdminActionsInput,
  ): Promise<ListAdminActionsResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;
    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;
    const filters = [
      input.from,
      input.to,
      input.actorId ?? null,
      input.targetType ?? null,
      input.targetId ?? null,
      input.action ?? null,
      input.search?.trim() || null,
    ];

    const rows = await this.dataSource.query<AdminActionRawRow[]>(
      `
        SELECT
          admin_action.id AS "id",
          admin_action.action AS "action",
          admin_action.target_type AS "targetType",
          admin_action.target_id AS "targetId",
          COALESCE(
            target_user.email,
            target_plan.name,
            target_category.name,
            target_site.subdomain
          ) AS "targetLabel",
          admin_action.changes AS "changes",
          host(admin_action.ip_address) AS "ipAddress",
          admin_action.user_agent AS "userAgent",
          admin_action.created_at AS "createdAt",
          acting_admin.id AS "actorId",
          acting_admin.username AS "actorUsername",
          acting_admin.email AS "actorEmail",
          acting_admin.system_role AS "actorSystemRole"
        ${ACTIONS_FROM}
        ORDER BY admin_action.created_at DESC, admin_action.id
        LIMIT $8
        OFFSET $9
      `,
      [...filters, limit, (page - 1) * limit],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(`SELECT COUNT(*) AS total ${ACTIONS_FROM}`, filters);

    return {
      items: rows.map((row) => this.toItem(row)),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  private toItem(row: AdminActionRawRow): AdminActionItem {
    return {
      id: row.id,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      targetLabel: row.targetLabel,
      changes: row.changes,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: new Date(row.createdAt),
      actor:
        row.actorId && row.actorSystemRole
          ? {
              id: row.actorId,
              username: row.actorUsername ?? '',
              email: row.actorEmail ?? '',
              systemRole: row.actorSystemRole,
            }
          : null,
    };
  }
}
