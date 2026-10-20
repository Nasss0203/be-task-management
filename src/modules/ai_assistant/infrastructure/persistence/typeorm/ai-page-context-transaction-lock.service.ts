import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiPageContextTransactionLocker } from '../../../application/services/ai-page-context-transaction-lock.port';

/**
 * Holds PostgreSQL row locks for the complete AI-visible Page context until
 * Confirm's UnitOfWork commits (or rolls back).
 *
 * Lock parents before children. FOR UPDATE conflicts with normal UPDATE/DELETE
 * and with the FOR KEY SHARE check performed when a child is INSERTed through
 * a foreign key. Locking existing children alone would allow phantom inserts.
 *
 * The databases included are the ones referenced by an active Page block; the
 * AI context does not contain unrelated databases belonging to the same Page.
 * Do not move these queries outside the caller's transaction.
 */
@Injectable()
export class AiPageContextTransactionLockService implements AiPageContextTransactionLocker {
  async lock(
    pageId: string,
    context: PersistenceContext,
    userId: string,
  ): Promise<void> {
    const manager = context as EntityManager;
    if (!manager?.queryRunner?.isTransactionActive) {
      throw new Error('AI Page context locks require an active transaction');
    }

    const referencedDatabases = `
      SELECT d.id
      FROM databases d
      WHERE d.page_id = $1
        AND d.id::text IN (
          SELECT pb.data_config ->> 'database_id'
          FROM page_blocks pb
          WHERE pb.page_id = $1
            AND pb.deleted_at IS NULL
        )
    `;
    const properties = `
      SELECT id FROM database_properties
      WHERE database_id IN (${referencedDatabases})
    `;
    const views = `
      SELECT id FROM database_views
      WHERE database_id IN (${referencedDatabases})
    `;
    const rows = `
      SELECT id FROM database_rows
      WHERE database_id IN (${referencedDatabases})
    `;

    const lockQueries = [
      'SELECT id FROM pages WHERE id = $1 FOR UPDATE',
      'SELECT id FROM page_blocks WHERE page_id = $1 ORDER BY id FOR UPDATE',
      `SELECT id FROM databases WHERE id IN (${referencedDatabases}) ORDER BY id FOR UPDATE`,
      `SELECT id FROM database_properties WHERE id IN (${properties}) ORDER BY id FOR UPDATE`,
      `SELECT id FROM database_property_options WHERE property_id IN (${properties}) ORDER BY id FOR UPDATE`,
      `SELECT id FROM database_views WHERE id IN (${views}) ORDER BY id FOR UPDATE`,
      `SELECT id FROM database_view_properties WHERE view_id IN (${views}) ORDER BY id FOR UPDATE`,
      `SELECT id FROM database_rows WHERE id IN (${rows}) ORDER BY id FOR UPDATE`,
      `SELECT id FROM database_row_values WHERE row_id IN (${rows}) ORDER BY id FOR UPDATE`,
    ];

    for (const sql of lockQueries) {
      await manager.query(sql, [pageId]);
    }

    // AuthorizationService reads these permission sources on separate queries.
    // Hold SHARE locks on the rows that could *revoke* this user's permissions
    // until the generation is APPLIED. Permission updates/deletes (including
    // inherited Page Shares) must then wait; if they commit first, the
    // subsequent authorize() calls see the revoked permission.
    const ancestorPages = `
      WITH RECURSIVE ancestors AS (
        SELECT id, parent_page_id FROM pages WHERE id = $1 AND deleted_at IS NULL
        UNION ALL
        SELECT parent.id, parent.parent_page_id
        FROM pages parent JOIN ancestors child ON parent.id = child.parent_page_id
        WHERE parent.deleted_at IS NULL
      )
      SELECT id FROM ancestors
    `;
    const permissionLocks = [
      `SELECT id FROM page_shares
       WHERE user_id = $2 AND page_id IN (${ancestorPages})
       ORDER BY id FOR SHARE`,
      // Page general access may be inherited from an ancestor Page.
      `SELECT id FROM page_share_settings
       WHERE page_id IN (${ancestorPages}) ORDER BY id FOR SHARE`,
      'SELECT id FROM page_share_links WHERE page_id = $1 ORDER BY id FOR SHARE',
      `SELECT id FROM workspace_members
       WHERE user_id = $2 AND workspace_id = (SELECT workspace_id FROM pages WHERE id = $1)
       ORDER BY id FOR SHARE`,
      `SELECT id FROM teamspace_members
       WHERE workspace_member_id IN (
         SELECT id FROM workspace_members WHERE user_id = $2
       ) AND teamspace_id = (SELECT teamspace_id FROM pages WHERE id = $1)
       ORDER BY id FOR SHARE`,
      `SELECT id FROM teamspaces
       WHERE id = (SELECT teamspace_id FROM pages WHERE id = $1)
       ORDER BY id FOR SHARE`,
    ];
    for (const sql of permissionLocks) {
      await manager.query(
        sql,
        sql.includes('$2') ? [pageId, userId] : [pageId],
      );
    }
  }
}
