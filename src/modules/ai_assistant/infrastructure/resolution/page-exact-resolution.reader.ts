import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import {
  MAX_RECENT_EDITED_PAGES,
  type PagePlace,
  type PageResolutionReader,
  type RecentEditsQuery,
  type RecentlyEditedPage,
} from '../../application/resolution/page-resolution.port';
import type { TitledPage } from '../../application/resolution/page-title-sentence-matcher';

@Injectable()
export class PageExactResolutionReader implements PageResolutionReader {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,
    private readonly dataSource: DataSource,
  ) {}

  async findAccessibleByExactTitle(
    userId: string,
    workspaceId: string,
    title: string,
  ): Promise<Page[]> {
    // M1: the title is compared in SQL (NFC, any case), inside Content's
    // workspace/teamspace-scoped query; never search all pages.
    const pages = await this.pageRepository.findAccessibleByExactTitle(
      workspaceId,
      userId,
      title,
    );
    return pages.filter(
      (page) =>
        page.getDeletedAt() === null && page.getWorkspaceId() === workspaceId,
    );
  }

  async findAccessibleTitlesInWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<TitledPage[]> {
    // Only id and title: matching a sentence needs no Page aggregates.
    return this.pageRepository.findAccessibleTitlesByWorkspace(
      workspaceId,
      userId,
    );
  }

  async findRecentlyEditedPages(
    userId: string,
    workspaceId: string,
    query: RecentEditsQuery,
  ): Promise<RecentlyEditedPage[]> {
    // Day and week bounds are taken in the user's zone (plan-v2 §11 #7);
    // created_at is a timestamp without zone in the session's zone, so it is
    // turned into an instant with current_setting('TimeZone') before comparing.
    const rows = await this.dataSource.query<
      { id: string; title: string; last_edited_at: Date }[]
    >(
      `WITH now_local AS (SELECT $6::timestamptz AT TIME ZONE $3 AS t),
       bounds AS (
         SELECT CASE $4::text
             WHEN 'TODAY' THEN date_trunc('day', t)
             WHEN 'YESTERDAY' THEN date_trunc('day', t) - interval '1 day'
             WHEN 'N_DAYS_AGO' THEN date_trunc('day', t) - make_interval(days => $5::int)
             WHEN 'LAST_WEEK' THEN date_trunc('week', t) - interval '7 days'
             WHEN 'RECENT' THEN t - interval '7 days'
             ELSE t - interval '90 days'
           END AS from_local,
           CASE $4::text
             WHEN 'YESTERDAY' THEN date_trunc('day', t)
             WHEN 'N_DAYS_AGO' THEN date_trunc('day', t) - make_interval(days => $5::int - 1)
             WHEN 'LAST_WEEK' THEN date_trunc('week', t)
             ELSE t + interval '1 minute'
           END AS to_local
         FROM now_local
       )
       SELECT p.id, p.title,
              max(a.created_at AT TIME ZONE current_setting('TimeZone')) AS last_edited_at
         FROM activities a
         JOIN pages p
           ON p.id = CASE WHEN a.entity_type = 'PAGE' THEN a.entity_id
                          ELSE (a.metadata ->> 'pageId')::uuid END
        CROSS JOIN bounds b
        WHERE a.actor_id = $1
          AND a.workspace_id = $2
          AND a.entity_type IN ('PAGE', 'PAGE_BLOCK')
          AND a.action IN ('PAGE_CREATED', 'PAGE_UPDATED', 'PAGE_RESTORED',
                           'PAGE_BLOCK_CREATED', 'PAGE_BLOCK_UPDATED',
                           'PAGE_BLOCK_DELETED', 'PAGE_BLOCK_REORDERED')
          AND p.workspace_id = $2
          AND p.deleted_at IS NULL
          AND a.created_at AT TIME ZONE current_setting('TimeZone') >= b.from_local AT TIME ZONE $3
          AND a.created_at AT TIME ZONE current_setting('TimeZone') < b.to_local AT TIME ZONE $3
        GROUP BY p.id, p.title
        ORDER BY last_edited_at DESC
        LIMIT ${MAX_RECENT_EDITED_PAGES}`,
      [
        userId,
        workspaceId,
        query.timeZone,
        query.relative,
        query.days,
        query.now ?? new Date(),
      ],
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      lastEditedAt: new Date(row.last_edited_at),
    }));
  }

  async findProfileTimeZone(userId: string): Promise<string | null> {
    const [profile] = await this.dataSource.query<
      { timezone: string | null }[]
    >('SELECT timezone FROM user_profiles WHERE user_id = $1', [userId]);
    return profile?.timezone ?? null;
  }

  async findPagePlaces(pageIds: string[]): Promise<Map<string, PagePlace>> {
    if (pageIds.length === 0) return new Map();
    // Ancestors at any depth (at most 20 levels), live Pages only.
    const ancestors = await this.dataSource.query<
      { page_id: string; title: string }[]
    >(
      `WITH RECURSIVE chain AS (
         SELECT id AS page_id, parent_page_id AS ancestor_id, 1 AS depth
           FROM pages WHERE id = ANY($1::uuid[])
         UNION ALL
         SELECT chain.page_id, parent.parent_page_id, chain.depth + 1
           FROM chain JOIN pages parent ON parent.id = chain.ancestor_id
          WHERE chain.depth < 20
       )
       SELECT chain.page_id, ancestor.title
         FROM chain JOIN pages ancestor ON ancestor.id = chain.ancestor_id
        WHERE ancestor.deleted_at IS NULL`,
      [pageIds],
    );
    const teamspaces = await this.dataSource.query<
      { id: string; name: string | null }[]
    >(
      `SELECT page.id, teamspace.name
         FROM pages page
         LEFT JOIN teamspaces teamspace
           ON teamspace.id = page.teamspace_id AND teamspace.deleted_at IS NULL
        WHERE page.id = ANY($1::uuid[])`,
      [pageIds],
    );
    const places = new Map<string, PagePlace>(
      teamspaces.map((row) => [
        row.id,
        { ancestorTitles: [], teamspaceName: row.name },
      ]),
    );
    for (const row of ancestors) {
      places.get(row.page_id)?.ancestorTitles.push(row.title);
    }
    return places;
  }
}
