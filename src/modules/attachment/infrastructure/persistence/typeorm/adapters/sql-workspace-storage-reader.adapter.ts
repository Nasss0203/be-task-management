import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  ListStorageFilesInput,
  StorageFile,
  StorageFileSort,
  StorageFileStatus,
  StorageFileType,
  WorkspaceStorageReader,
  WorkspaceStorageUsage,
} from '../../../../application/ports/workspace-storage-reader.port';
import { AttachmentStatus } from '../../../../domain/enums/attachment-status.enum';

const DOCUMENT_MIME_TYPES = [
  'text/plain',
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/x-cfb',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const TYPE_SQL = `CASE
  WHEN a.mime_type LIKE 'image/%' THEN 'image'
  WHEN a.mime_type = ANY($2::text[]) THEN 'document'
  ELSE 'other'
END`;

const FILES_CTE = `WITH files AS (
  SELECT
    a.id,
    a.file_name,
    a.mime_type,
    a.size,
    a.created_at,
    a.uploaded_by,
    ${TYPE_SQL} AS type,
    p.id AS page_id,
    p.title AS page_title,
    CASE
      WHEN p.id IS NULL OR (a.page_block_id IS NOT NULL AND pb.id IS NULL)
        OR (a.comment_id IS NOT NULL AND c.id IS NULL)
        THEN 'ORPHANED'
      WHEN p.deleted_at IS NOT NULL OR pb.deleted_at IS NOT NULL
        OR c.deleted_at IS NOT NULL
        THEN 'IN_TRASH'
      ELSE 'IN_USE'
    END AS status
  FROM attachments a
  LEFT JOIN page_blocks pb ON pb.id = a.page_block_id
  LEFT JOIN comments c ON c.id = a.comment_id
  LEFT JOIN pages p ON p.id = COALESCE(pb.page_id, c.page_id)
  WHERE a.workspace_id = $1
    AND a.status = $3
    AND ($4::uuid IS NULL OR a.uploaded_by = $4::uuid)
)`;

const FILTER_SQL = `WHERE ($5::text IS NULL OR f.type = $5)
  AND ($6::text IS NULL OR f.status = $6)
  AND ($7::text IS NULL OR f.file_name ILIKE $7)`;

const ORDER_BY: Record<StorageFileSort, string> = {
  size_desc: 'f.size DESC, f.created_at DESC, f.id',
  created_desc: 'f.created_at DESC, f.id',
  created_asc: 'f.created_at ASC, f.id',
};

type UsageRow = {
  type: StorageFileType;
  count: number;
  bytes: string;
  mine_count: number;
  mine_bytes: string;
};

type FileRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size: string;
  created_at: Date;
  type: StorageFileType;
  status: StorageFileStatus;
  page_id: string | null;
  page_title: string | null;
  uploader_id: string | null;
  uploader_username: string | null;
  uploader_avatar_url: string | null;
};

@Injectable()
export class SqlWorkspaceStorageReader implements WorkspaceStorageReader {
  constructor(private readonly dataSource: DataSource) {}

  async getUsage(
    workspaceId: string,
    actorId: string,
  ): Promise<WorkspaceStorageUsage> {
    const rows = await this.dataSource.query<UsageRow[]>(
      `SELECT ${TYPE_SQL} AS type,
         COUNT(*)::int AS count,
         COALESCE(SUM(a.size), 0)::text AS bytes,
         (COUNT(*) FILTER (WHERE a.uploaded_by = $4::uuid))::int AS mine_count,
         COALESCE(SUM(a.size) FILTER (WHERE a.uploaded_by = $4::uuid), 0)::text AS mine_bytes
       FROM attachments a
       WHERE a.workspace_id = $1 AND a.status = $3
       GROUP BY 1`,
      [workspaceId, DOCUMENT_MIME_TYPES, AttachmentStatus.READY, actorId],
    );

    const usage: WorkspaceStorageUsage = {
      workspace: { bytes: 0, count: 0 },
      byType: {
        image: { bytes: 0, count: 0 },
        document: { bytes: 0, count: 0 },
        other: { bytes: 0, count: 0 },
      },
      mine: { bytes: 0, count: 0 },
    };

    for (const row of rows) {
      const bytes = Number(row.bytes);
      usage.byType[row.type] = { bytes, count: row.count };
      usage.workspace.bytes += bytes;
      usage.workspace.count += row.count;
      usage.mine.bytes += Number(row.mine_bytes);
      usage.mine.count += row.mine_count;
    }

    return usage;
  }

  async listFiles(
    input: ListStorageFilesInput,
  ): Promise<{ files: StorageFile[]; total: number }> {
    const pattern = input.search
      ? `%${input.search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
      : null;
    const params = [
      input.workspaceId,
      DOCUMENT_MIME_TYPES,
      AttachmentStatus.READY,
      input.uploadedBy,
      input.type ?? null,
      input.status ?? null,
      pattern,
    ];

    const [countRows, rows] = await Promise.all([
      this.dataSource.query<{ total: number }[]>(
        `${FILES_CTE} SELECT COUNT(*)::int AS total FROM files f ${FILTER_SQL}`,
        params,
      ),
      this.dataSource.query<FileRow[]>(
        `${FILES_CTE}
         SELECT f.id, f.file_name, f.mime_type, f.size::text AS size,
           f.created_at, f.type, f.status, f.page_id, f.page_title,
           u.id AS uploader_id, u.username AS uploader_username,
           u.avatar_url AS uploader_avatar_url
         FROM files f
         LEFT JOIN users u ON u.id = f.uploaded_by
         ${FILTER_SQL}
         ORDER BY ${ORDER_BY[input.sort]}
         LIMIT $8 OFFSET $9`,
        [...params, input.take, input.skip],
      ),
    ]);

    return {
      total: countRows[0]?.total ?? 0,
      files: rows.map((row) => ({
        id: row.id,
        fileName: row.file_name,
        mimeType: row.mime_type,
        size: Number(row.size),
        type: row.type,
        status: row.status,
        createdAt: row.created_at,
        uploadedBy: row.uploader_id
          ? {
              id: row.uploader_id,
              username: row.uploader_username ?? '',
              avatarUrl: row.uploader_avatar_url,
            }
          : null,
        location:
          row.page_id && row.page_title !== null
            ? { pageId: row.page_id, pageTitle: row.page_title }
            : null,
      })),
    };
  }
}
