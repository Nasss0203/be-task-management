import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CommentTargetLocation,
  CommentTargetResolver,
} from '../../../../application/ports/comment-target-resolver.port';
import { CommentTargetType } from '../../../../domain/enums/comment-target-type.enum';

// Đọc thẳng bảng của content/database như WorkspaceResolverService, để comments không phụ thuộc các module đó
const TARGET_QUERIES: Record<CommentTargetType, string> = {
  [CommentTargetType.PAGE]: `
    SELECT p.id AS "pageId", p.workspace_id AS "workspaceId"
    FROM pages p
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `,
  [CommentTargetType.PAGE_BLOCK]: `
    SELECT p.id AS "pageId", p.workspace_id AS "workspaceId", pb.row_id AS "rowId"
    FROM page_blocks pb
    INNER JOIN pages p ON p.id = pb.page_id
    WHERE pb.id = $1 AND pb.deleted_at IS NULL AND p.deleted_at IS NULL
  `,
  [CommentTargetType.DATABASE_ROW]: `
    SELECT p.id AS "pageId", p.workspace_id AS "workspaceId"
    FROM database_rows r
    INNER JOIN databases d ON d.id = r.database_id
    INNER JOIN pages p ON p.id = d.page_id
    WHERE r.id = $1 AND p.deleted_at IS NULL
  `,
};

@Injectable()
export class SqlCommentTargetResolver implements CommentTargetResolver {
  constructor(private readonly dataSource: DataSource) {}

  async resolve(
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<CommentTargetLocation | null> {
    const rows = await this.dataSource.query<CommentTargetLocation[]>(
      TARGET_QUERIES[targetType],
      [targetId],
    );

    return rows[0] ?? null;
  }
}
