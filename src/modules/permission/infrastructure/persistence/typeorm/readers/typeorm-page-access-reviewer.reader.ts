import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { PageAccessReviewerReader } from 'src/modules/permission/application/ports/page-access-reviewer-reader.port';
import type { PageGeneralAccessReader } from 'src/modules/permission/application/ports/page-general-access-reader.port';
import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';

interface PageContextRow {
  id: string;
  workspace_id: string;
  teamspace_id: string | null;
}

interface UserIdRow {
  user_id: string;
}

@Injectable()
export class TypeOrmPageAccessReviewerReader implements PageAccessReviewerReader {
  constructor(
    private readonly dataSource: DataSource,

    @Inject(PERMISSION_TYPES.ports.PageGeneralAccessReader)
    private readonly pageGeneralAccessReader: PageGeneralAccessReader,
  ) {}

  async findReviewerIds(pageId: string): Promise<string[]> {
    /**
     * 1. Lấy context của Page.
     */
    const pageRows = await this.dataSource.query<PageContextRow[]>(
      `
        SELECT
          id,
          workspace_id,
          teamspace_id
        FROM pages
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [pageId],
    );

    const page = pageRows[0];

    if (!page) {
      return [];
    }

    const reviewerIds = new Set<string>();

    /**
     * 2. Workspace OWNER.
     *
     * Workspace OWNER có PAGE_SHARE_UPDATE.
     */
    const workspaceOwners = await this.dataSource.query<UserIdRow[]>(
      `
          SELECT user_id
          FROM workspace_members
          WHERE workspace_id = $1
            AND membership_type = 'MEMBER'
            AND role_name = 'OWNER'
        `,
      [page.workspace_id],
    );

    for (const owner of workspaceOwners) {
      reviewerIds.add(owner.user_id);
    }

    /**
     * 3. Teamspace OWNER.
     *
     * Chỉ xét khi Page thuộc Teamspace còn tồn tại.
     */
    if (page.teamspace_id) {
      const teamspaceOwners = await this.dataSource.query<UserIdRow[]>(
        `
            SELECT DISTINCT wm.user_id
            FROM teamspace_members tm
            INNER JOIN workspace_members wm
              ON wm.id = tm.workspace_member_id
            INNER JOIN teamspaces t
              ON t.id = tm.teamspace_id
            WHERE tm.teamspace_id = $1
              AND wm.membership_type = 'MEMBER'
              AND tm.role_name = 'OWNER'
              AND t.deleted_at IS NULL
          `,
        [page.teamspace_id],
      );

      for (const owner of teamspaceOwners) {
        reviewerIds.add(owner.user_id);
      }
    }

    /**
     * 4. Effective PageShare FULL_ACCESS.
     *
     * QUAN TRỌNG:
     *
     * Phải:
     * - đi từ Page hiện tại lên ancestor
     * - chỉ xét ACCEPTED
     * - chọn share gần Page nhất cho từng user
     * - SAU ĐÓ mới kiểm tra FULL_ACCESS
     *
     * Ví dụ:
     *
     * Parent:
     * B = FULL_ACCESS
     *
     * Current:
     * B = EDITOR
     *
     * Effective của B phải là EDITOR,
     * nên B không phải reviewer.
     */
    const fullAccessShares = await this.dataSource.query<UserIdRow[]>(
      `
          WITH RECURSIVE page_chain AS (
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
              chain.depth + 1
            FROM pages parent
            INNER JOIN page_chain chain
              ON parent.id = chain.parent_page_id
            WHERE parent.deleted_at IS NULL
          ),

          effective_shares AS (
            SELECT DISTINCT ON (ps.user_id)
              ps.user_id,
              ps.access_level,
              chain.depth
            FROM page_chain chain
            INNER JOIN page_shares ps
              ON ps.page_id = chain.id
            WHERE ps.status = 'ACCEPTED'
            ORDER BY
              ps.user_id,
              chain.depth ASC
          )

          SELECT user_id
          FROM effective_shares
          WHERE access_level = 'FULL_ACCESS'
        `,
      [pageId],
    );

    for (const share of fullAccessShares) {
      reviewerIds.add(share.user_id);
    }

    /**
     * 5. Effective Workspace General Access.
     *
     * Nếu Page effective setting là FULL_ACCESS,
     * mọi Workspace Member đều có PAGE_SHARE_UPDATE.
     */
    const generalAccess =
      await this.pageGeneralAccessReader.findByPageId(pageId);

    if (
      generalAccess?.workspaceAccessLevel === ResourceAccessLevel.FULL_ACCESS
    ) {
      const workspaceMembers = await this.dataSource.query<UserIdRow[]>(
        `
            SELECT user_id
            FROM workspace_members
            WHERE workspace_id = $1
              AND membership_type = 'MEMBER'
          `,
        [page.workspace_id],
      );

      for (const member of workspaceMembers) {
        reviewerIds.add(member.user_id);
      }
    }

    return [...reviewerIds];
  }
}
