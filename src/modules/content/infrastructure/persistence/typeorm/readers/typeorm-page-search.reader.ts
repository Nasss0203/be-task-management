import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  PageSearchReader,
  PageSearchRow,
} from '../../../../application/ports/page-search-reader.port';
import {
  VIETNAMESE_ACCENTED,
  VIETNAMESE_PLAIN,
  escapeLikePattern,
} from '../../../../application/services/search-text';

interface PageSearchRawRow {
  pageId: string;
  title: string | null;
  icon: string | null;
  teamspaceId: string | null;
  parentPageId: string | null;
  updatedAt: Date;
  matchedInTitle: boolean;
  snippet: string | null;
}

const normalized = (expression: string) =>
  `translate(lower(coalesce(${expression}, '')), $4, $5)`;

@Injectable()
export class TypeOrmPageSearchReader implements PageSearchReader {
  constructor(private readonly dataSource: DataSource) {}

  async search(input: {
    workspaceId: string;
    userId: string;
    normalizedQuery: string;
    limit: number;
  }): Promise<PageSearchRow[]> {
    const pattern = `%${escapeLikePattern(input.normalizedQuery)}%`;

    const rows = await this.dataSource.query<PageSearchRawRow[]>(
      `
        WITH accessible AS (
          SELECT DISTINCT p.id, p.title, p.icon, p.teamspace_id, p.parent_page_id, p.updated_at
          FROM pages p
          INNER JOIN workspace_members wm
            ON wm.workspace_id = p.workspace_id
           AND wm.user_id = $2
           AND wm.membership_type = 'MEMBER'
          LEFT JOIN teamspace_members tm
            ON tm.teamspace_id = p.teamspace_id
           AND tm.workspace_member_id = wm.id
          WHERE p.workspace_id = $1
            AND p.deleted_at IS NULL
            AND (wm.role_name = 'OWNER' OR p.teamspace_id IS NULL OR tm.id IS NOT NULL)
            AND NOT EXISTS (
              SELECT 1 FROM teamspaces t
              WHERE t.id = p.teamspace_id AND t.deleted_at IS NOT NULL
            )
        )
        SELECT
          a.id AS "pageId",
          a.title,
          a.icon,
          a.teamspace_id AS "teamspaceId",
          a.parent_page_id AS "parentPageId",
          a.updated_at AS "updatedAt",
          (${normalized('a.title')} LIKE $3) AS "matchedInTitle",
          block.text AS snippet
        FROM accessible a
        LEFT JOIN LATERAL (
          SELECT b.content->>'text' AS text
          FROM page_blocks b
          WHERE b.page_id = a.id
            AND b.deleted_at IS NULL
            AND $3 <> '%%'
            AND ${normalized("b.content->>'text'")} LIKE $3
          ORDER BY b.order_index
          LIMIT 1
        ) block ON true
        WHERE $3 = '%%'
           OR ${normalized('a.title')} LIKE $3
           OR block.text IS NOT NULL
        ORDER BY "matchedInTitle" DESC, a.updated_at DESC
        LIMIT $6
      `,
      [
        input.workspaceId,
        input.userId,
        pattern,
        VIETNAMESE_ACCENTED,
        VIETNAMESE_PLAIN,
        input.limit,
      ],
    );

    return rows.map((row) => ({
      ...row,
      title: row.title ?? '',
      matchedInTitle: Boolean(row.matchedInTitle),
    }));
  }
}
