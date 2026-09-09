import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  EffectivePageShare,
  PageSharePermissionReader,
} from '../../../../application/ports/page-share-permission-reader.port';

interface PageShareAccessRow {
  shareId: string;

  sharedPageId: string;

  accessLevel: EffectivePageShare['accessLevel'];
}

@Injectable()
export class TypeOrmPageSharePermissionReader implements PageSharePermissionReader {
  constructor(private readonly dataSource: DataSource) {}

  async findEffectiveShare(
    pageId: string,
    userId: string,
  ): Promise<EffectivePageShare | null> {
    const rows = await this.dataSource.query<PageShareAccessRow[]>(
      `
        WITH RECURSIVE page_ancestors AS (
        
          SELECT
            id,
            parent_page_id,
            0 AS depth
          FROM pages
          WHERE id = $1
            AND deleted_at IS NULL

          UNION ALL

       
          SELECT
            parent.id,
            parent.parent_page_id,
            child.depth + 1
          FROM pages parent
          INNER JOIN page_ancestors child
            ON parent.id = child.parent_page_id
          WHERE parent.deleted_at IS NULL
        )

        SELECT
          page_share.id AS "shareId",
          page_share.page_id AS "sharedPageId",
          page_share.access_level AS "accessLevel"

        FROM page_ancestors ancestor

        INNER JOIN page_shares page_share
          ON page_share.page_id = ancestor.id
         AND page_share.user_id = $2


        ORDER BY ancestor.depth ASC

        LIMIT 1
        `,
      [pageId, userId],
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      shareId: row.shareId,

      sharedPageId: row.sharedPageId,

      accessLevel: row.accessLevel,
    };
  }
}
