import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  SiteThemeImage,
  SiteThemeImageReader,
} from '../../../../application/ports/site-theme-image-reader.port';

interface SiteThemeImageRawRow {
  id: string;
  url: string;
  mimeType: string;
  size: string | number;
}

@Injectable()
export class TypeOrmSiteThemeImageReader implements SiteThemeImageReader {
  constructor(private readonly dataSource: DataSource) {}

  async findReadyImages(
    workspaceId: string,
    attachmentIds: string[],
  ): Promise<SiteThemeImage[]> {
    if (attachmentIds.length === 0) return [];

    const rows = await this.dataSource.query<SiteThemeImageRawRow[]>(
      `
        SELECT
          attachment.id AS "id",
          attachment.secure_url AS "url",
          attachment.mime_type AS "mimeType",
          attachment.size AS "size"
        FROM attachments attachment
        WHERE attachment.workspace_id = $1
          AND attachment.id = ANY($2::uuid[])
          AND attachment.status = 'READY'
          AND attachment.secure_url IS NOT NULL
      `,
      [workspaceId, attachmentIds],
    );

    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      mimeType: row.mimeType,
      size: Number(row.size),
    }));
  }
}
