import { Injectable } from '@nestjs/common';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { DataSource } from 'typeorm';
import {
  MentionCandidate,
  MentionCandidateReader,
  MentionPageScope,
} from '../../../../application/ports/mention-candidate-reader.port';

@Injectable()
export class SqlMentionCandidateReader implements MentionCandidateReader {
  constructor(private readonly dataSource: DataSource) {}

  async findPageScope(pageId: string): Promise<MentionPageScope | null> {
    const rows = await this.dataSource.query<MentionPageScope[]>(
      `SELECT workspace_id AS "workspaceId", teamspace_id AS "teamspaceId"
       FROM pages
       WHERE id = $1 AND deleted_at IS NULL`,
      [pageId],
    );

    return rows[0] ?? null;
  }

  findMembers(input: {
    scope: MentionPageScope;
    query?: string;
    userIds?: string[];
    excludeUserId?: string;
    limit: number;
  }): Promise<MentionCandidate[]> {
    // Escape % và _ để chuỗi tìm kiếm của user không thành wildcard
    const pattern = input.query
      ? `%${input.query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
      : null;

    return this.dataSource.query<MentionCandidate[]>(
      `SELECT u.id, u.username, u.email, u.avatar_url AS "avatarUrl"
       FROM workspace_members wm
       INNER JOIN users u
         ON u.id = wm.user_id AND u.deleted_at IS NULL AND u.is_active = true
       WHERE wm.workspace_id = $1
         AND wm.membership_type = $2
         AND (
           $3::uuid IS NULL OR EXISTS (
             SELECT 1 FROM teamspace_members tm
             WHERE tm.teamspace_id = $3 AND tm.workspace_member_id = wm.id
           )
         )
         AND ($4::text IS NULL OR u.username ILIKE $4 OR u.email ILIKE $4)
         AND ($5::uuid[] IS NULL OR u.id = ANY($5::uuid[]))
         AND ($6::uuid IS NULL OR u.id <> $6::uuid)
       ORDER BY u.username ASC
       LIMIT $7`,
      [
        input.scope.workspaceId,
        WorkspaceMembershipType.MEMBER,
        input.scope.teamspaceId,
        pattern,
        input.userIds ?? null,
        input.excludeUserId ?? null,
        input.limit,
      ],
    );
  }
}
