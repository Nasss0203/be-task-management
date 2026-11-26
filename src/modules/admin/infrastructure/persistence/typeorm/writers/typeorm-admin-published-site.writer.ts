import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import type {
  AdminPublishedSiteModerationOutcome,
  AdminPublishedSiteModerationResult,
  AdminPublishedSiteWriter,
  DisableAdminPublishedSiteInput,
  RestoreAdminPublishedSiteInput,
} from '../../../../application/ports/admin-published-site-writer.port';
import { insertAdminAction } from './typeorm-admin-action.recorder';

interface SiteModerationRow {
  id: string;
  disabledAt: Date | string | null;
  moderationDisabledAt: Date | string | null;
  moderationDisabledBy: string | null;
  moderationReason: string | null;
}

const MODERATION_COLUMNS = `
  id,
  disabled_at AS "disabledAt",
  moderation_disabled_at AS "moderationDisabledAt",
  moderation_disabled_by AS "moderationDisabledBy",
  moderation_reason AS "moderationReason"
`;

function toDate(value: Date | string | null): Date | null {
  return value === null ? null : new Date(value);
}

function toResult(row: SiteModerationRow): AdminPublishedSiteModerationResult {
  const moderationDisabledAt = toDate(row.moderationDisabledAt);

  return {
    id: row.id,
    disabledAt: toDate(row.disabledAt),
    moderation: moderationDisabledAt
      ? {
          disabledAt: moderationDisabledAt,
          disabledBy: row.moderationDisabledBy,
          reason: row.moderationReason,
        }
      : null,
  };
}

@Injectable()
export class TypeOrmAdminPublishedSiteWriter implements AdminPublishedSiteWriter {
  constructor(private readonly dataSource: DataSource) {}

  async disableSite(
    input: DisableAdminPublishedSiteInput,
  ): Promise<AdminPublishedSiteModerationOutcome> {
    return this.dataSource.transaction(async (manager) => {
      const previous = await this.lockSite(manager, input.siteId);

      if (!previous) {
        return { kind: 'NOT_FOUND' };
      }

      if (previous.moderationDisabledAt !== null) {
        return { kind: 'UNCHANGED' };
      }

      const [rows] = await manager.query<[SiteModerationRow[], number]>(
        `
          UPDATE published_sites
          SET
            disabled_at = COALESCE(disabled_at, CURRENT_TIMESTAMP),
            moderation_disabled_at = CURRENT_TIMESTAMP,
            moderation_disabled_by = $2,
            moderation_reason = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING ${MODERATION_COLUMNS}
        `,
        [input.siteId, input.actor.userId, input.reason],
      );

      const site = toResult(rows[0]);

      await insertAdminAction(manager, {
        actor: input.actor,
        action: 'PUBLISHED_SITE_DISABLED',
        targetType: 'PUBLISHED_SITE',
        targetId: site.id,
        changes: {
          disabledByAdmin: { from: false, to: true },
          reason: { to: input.reason },
        },
      });

      return { kind: 'DONE', site };
    });
  }

  async restoreSite(
    input: RestoreAdminPublishedSiteInput,
  ): Promise<AdminPublishedSiteModerationOutcome> {
    return this.dataSource.transaction(async (manager) => {
      const previous = await this.lockSite(manager, input.siteId);

      if (!previous) {
        return { kind: 'NOT_FOUND' };
      }

      if (previous.moderationDisabledAt === null) {
        return { kind: 'UNCHANGED' };
      }

      const [rows] = await manager.query<[SiteModerationRow[], number]>(
        `
          UPDATE published_sites
          SET
            moderation_disabled_at = NULL,
            moderation_disabled_by = NULL,
            moderation_reason = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING ${MODERATION_COLUMNS}
        `,
        [input.siteId],
      );

      const site = toResult(rows[0]);

      await insertAdminAction(manager, {
        actor: input.actor,
        action: 'PUBLISHED_SITE_RESTORED',
        targetType: 'PUBLISHED_SITE',
        targetId: site.id,
        changes: {
          disabledByAdmin: { from: true, to: false },
          reason: { from: previous.moderationReason },
        },
      });

      return { kind: 'DONE', site };
    });
  }

  private async lockSite(
    manager: EntityManager,
    siteId: string,
  ): Promise<SiteModerationRow | null> {
    const rows = await manager.query<SiteModerationRow[]>(
      `
        SELECT ${MODERATION_COLUMNS}
        FROM published_sites
        WHERE id = $1
        FOR UPDATE
      `,
      [siteId],
    );

    return rows[0] ?? null;
  }
}
