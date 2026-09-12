import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  PageGeneralAccessContext,
  PageGeneralAccessReader,
} from '../../../../application/ports/page-general-access-reader.port';

interface PageGeneralAccessRow {
  generalAccess: PageGeneralAccessContext['generalAccess'];

  linkAccessLevel: PageGeneralAccessContext['linkAccessLevel'];
}

@Injectable()
export class TypeOrmPageGeneralAccessReader implements PageGeneralAccessReader {
  constructor(private readonly dataSource: DataSource) {}

  async findByPageId(pageId: string): Promise<PageGeneralAccessContext | null> {
    const rows = await this.dataSource.query<PageGeneralAccessRow[]>(
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

          /**
           * Đi ngược lên toàn bộ parent.
           */
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
          setting.general_access AS "generalAccess",
          setting.link_access_level AS "linkAccessLevel"

        FROM page_ancestors ancestor

        INNER JOIN page_share_settings setting
          ON setting.page_id = ancestor.id

      
        ORDER BY ancestor.depth ASC

        LIMIT 1
        `,
      [pageId],
    );

    return rows[0] ?? null;
  }
}
