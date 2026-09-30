import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  PublicSiteNavigationReader,
  PublicSiteNavigationRow,
} from '../../../../application/ports/public-site-navigation-reader.port';

interface PublicSiteNavigationRawRow {
  publicationId: string;
  pageId: string;
  path: string;
  parentPublicationId: string | null;
  unpublishedAt: Date | string | null;
  title: string;
  icon: string | null;
}

@Injectable()
export class TypeOrmPublicSiteNavigationReader implements PublicSiteNavigationReader {
  constructor(private readonly dataSource: DataSource) {}

  async listBySiteId(siteId: string): Promise<PublicSiteNavigationRow[]> {
    const rows = await this.dataSource.query<PublicSiteNavigationRawRow[]>(
      `
        SELECT
          publication.id AS "publicationId",
          publication.page_id AS "pageId",
          publication.path AS "path",
          publication.parent_publication_id AS "parentPublicationId",
          publication.unpublished_at AS "unpublishedAt",
          page.title AS "title",
          page.icon AS "icon"
        FROM page_publications publication
        INNER JOIN pages page
          ON page.id = publication.page_id
        WHERE publication.site_id = $1
          AND page.deleted_at IS NULL
        ORDER BY publication.path ASC
      `,
      [siteId],
    );

    return rows.map((row) => ({
      publicationId: row.publicationId,
      pageId: row.pageId,
      path: row.path,
      parentPublicationId: row.parentPublicationId,
      unpublishedAt: row.unpublishedAt ? new Date(row.unpublishedAt) : null,
      title: row.title,
      icon: row.icon,
    }));
  }
}
