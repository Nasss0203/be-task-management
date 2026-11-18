import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { resolvePublicSiteDomain } from 'src/common/config/frontend-origin.config';
import type { PagePublicationType } from 'src/modules/content/domain/enums/page-publication-type.enum';

import {
  AdminPublishedSiteStatusFilter,
  type AdminPublishedSiteDetail,
  type AdminPublishedSiteReader,
  type AdminPublishedSitesOverview,
  type AdminPublishedSiteSummary,
  type ListAdminPublishedSitesInput,
  type ListAdminPublishedSitesResult,
} from '../../../../application/ports/admin-published-site-reader.port';

interface OverviewRawRow {
  sites: number | string;
  active: number | string;
  disabled: number | string;
  publicPages: number | string;
}

interface SiteRawRow {
  id: string;
  subdomain: string;
  rootPageId: string;
  rootPageTitle: string;
  workspaceId: string;
  workspaceName: string;
  creatorId: string;
  creatorEmail: string;
  creatorUsername: string;
  allowUpdates: boolean;
  publicPages: number | string;
  lastPublishedAt: Date | string | null;
  createdAt: Date | string;
  disabledAt: Date | string | null;
}

interface PageRawRow {
  publicationId: string;
  pageId: string;
  title: string;
  path: string;
  publicationType: PagePublicationType;
  includeDescendants: boolean;
  pageDeletedAt: Date | string | null;
  publisherId: string;
  publisherEmail: string;
  publisherUsername: string;
  publishedAt: Date | string;
  unpublishedAt: Date | string | null;
}

const PUBLIC_PUBLICATION = `
  publication.unpublished_at IS NULL
  AND site.disabled_at IS NULL
  AND publication_page.deleted_at IS NULL
`;

const SITE_COLUMNS = `
  site.id AS "id",
  site.subdomain AS "subdomain",
  root_page.id AS "rootPageId",
  root_page.title AS "rootPageTitle",
  workspace.id AS "workspaceId",
  workspace.name AS "workspaceName",
  creator.id AS "creatorId",
  creator.email AS "creatorEmail",
  creator.username AS "creatorUsername",
  site.allow_updates AS "allowUpdates",
  (
    SELECT COUNT(*)::int
    FROM page_publications publication
    INNER JOIN pages publication_page ON publication_page.id = publication.page_id
    WHERE publication.site_id = site.id
      AND ${PUBLIC_PUBLICATION}
  ) AS "publicPages",
  (
    SELECT MAX(publication.published_at)
    FROM page_publications publication
    WHERE publication.site_id = site.id
  ) AS "lastPublishedAt",
  site.created_at AS "createdAt",
  site.disabled_at AS "disabledAt"
`;

const SITE_JOINS = `
  FROM published_sites site
  INNER JOIN pages root_page ON root_page.id = site.root_page_id
  INNER JOIN workspaces workspace ON workspace.id = site.workspace_id
  INNER JOIN users creator ON creator.id = site.created_by
`;

const SITES_FROM = `
  ${SITE_JOINS}
  WHERE (
      $1::text IS NULL
      OR site.subdomain ILIKE '%' || $1 || '%'
      OR root_page.title ILIKE '%' || $1 || '%'
      OR workspace.name ILIKE '%' || $1 || '%'
      OR creator.email ILIKE '%' || $1 || '%'
      OR creator.username ILIKE '%' || $1 || '%'
    )
    AND (
      $2::text IS NULL
      OR ($2 = 'ACTIVE' AND site.disabled_at IS NULL)
      OR ($2 = 'DISABLED' AND site.disabled_at IS NOT NULL)
    )
`;

const MAX_DETAIL_PAGES = 500;

function toDate(value: Date | string | null): Date | null {
  return value === null ? null : new Date(value);
}

@Injectable()
export class TypeOrmAdminPublishedSiteReader implements AdminPublishedSiteReader {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async getOverview(): Promise<AdminPublishedSitesOverview> {
    const rows = await this.dataSource.query<OverviewRawRow[]>(
      `
        SELECT
          COUNT(*)::int AS "sites",
          COUNT(*) FILTER (WHERE disabled_at IS NULL)::int AS "active",
          COUNT(*) FILTER (WHERE disabled_at IS NOT NULL)::int AS "disabled",
          (
            SELECT COUNT(*)::int
            FROM page_publications publication
            INNER JOIN published_sites site ON site.id = publication.site_id
            INNER JOIN pages publication_page
              ON publication_page.id = publication.page_id
            WHERE ${PUBLIC_PUBLICATION}
          ) AS "publicPages"
        FROM published_sites
      `,
    );
    const row = rows[0];

    return {
      sites: Number(row?.sites ?? 0),
      active: Number(row?.active ?? 0),
      disabled: Number(row?.disabled ?? 0),
      publicPages: Number(row?.publicPages ?? 0),
    };
  }

  async listSites(
    input: ListAdminPublishedSitesInput,
  ): Promise<ListAdminPublishedSitesResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;
    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;
    const filters = [
      input.search?.trim() || null,
      input.status === AdminPublishedSiteStatusFilter.ALL ? null : input.status,
    ];

    const rows = await this.dataSource.query<SiteRawRow[]>(
      `
        SELECT ${SITE_COLUMNS}
        ${SITES_FROM}
        ORDER BY site.created_at DESC, site.id
        LIMIT $3
        OFFSET $4
      `,
      [...filters, limit, (page - 1) * limit],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(`SELECT COUNT(*) AS total ${SITES_FROM}`, filters);

    return {
      items: rows.map((row) => this.toSummary(row)),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async findSiteDetail(
    siteId: string,
  ): Promise<AdminPublishedSiteDetail | null> {
    const siteRows = await this.dataSource.query<SiteRawRow[]>(
      `SELECT ${SITE_COLUMNS} ${SITE_JOINS} WHERE site.id = $1`,
      [siteId],
    );

    if (!siteRows[0]) {
      return null;
    }

    const pageRows = await this.dataSource.query<PageRawRow[]>(
      `
        SELECT
          publication.id AS "publicationId",
          publication_page.id AS "pageId",
          publication_page.title AS "title",
          publication.path AS "path",
          publication.publication_type AS "publicationType",
          publication.include_descendants AS "includeDescendants",
          publication_page.deleted_at AS "pageDeletedAt",
          publisher.id AS "publisherId",
          publisher.email AS "publisherEmail",
          publisher.username AS "publisherUsername",
          publication.published_at AS "publishedAt",
          publication.unpublished_at AS "unpublishedAt"
        FROM page_publications publication
        INNER JOIN pages publication_page
          ON publication_page.id = publication.page_id
        INNER JOIN users publisher ON publisher.id = publication.published_by
        WHERE publication.site_id = $1
        ORDER BY publication.path, publication.id
        LIMIT $2
      `,
      [siteId, MAX_DETAIL_PAGES],
    );

    return {
      site: this.toSummary(siteRows[0]),
      pages: pageRows.map((row) => ({
        publicationId: row.publicationId,
        pageId: row.pageId,
        title: row.title,
        path: row.path,
        publicationType: row.publicationType,
        includeDescendants: row.includeDescendants,
        pageDeletedAt: toDate(row.pageDeletedAt),
        publishedBy: {
          id: row.publisherId,
          email: row.publisherEmail,
          username: row.publisherUsername,
        },
        publishedAt: new Date(row.publishedAt),
        unpublishedAt: toDate(row.unpublishedAt),
      })),
    };
  }

  private toSummary(row: SiteRawRow): AdminPublishedSiteSummary {
    const domain = resolvePublicSiteDomain(this.configService);

    return {
      id: row.id,
      subdomain: row.subdomain,
      url: domain ? `https://${row.subdomain}.${domain}` : null,
      rootPage: { id: row.rootPageId, title: row.rootPageTitle },
      workspace: { id: row.workspaceId, name: row.workspaceName },
      creator: {
        id: row.creatorId,
        email: row.creatorEmail,
        username: row.creatorUsername,
      },
      allowUpdates: row.allowUpdates,
      publicPages: Number(row.publicPages),
      lastPublishedAt: toDate(row.lastPublishedAt),
      createdAt: new Date(row.createdAt),
      disabledAt: toDate(row.disabledAt),
    };
  }
}
