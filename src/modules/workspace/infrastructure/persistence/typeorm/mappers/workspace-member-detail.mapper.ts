import { WorkspaceMemberDetail } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export type WorkspaceMemberDetailRaw = {
  id: string;
  workspace_id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role_name: WorkspaceRole;
  lastOpenedAt: Date | null;
  joinedAt: Date;
};

export class WorkspaceMemberDetailMapper {
  static toDomain(raw: WorkspaceMemberDetailRaw): WorkspaceMemberDetail {
    return WorkspaceMemberDetail.restore({
      id: raw.id,
      workspaceId: raw.workspace_id,
      userId: raw.user_id,
      fullName: raw.full_name,
      email: raw.email,
      role: raw.role_name,
      avatarUrl: raw.avatar_url ?? null,
      lastOpenedAt: raw.lastOpenedAt ?? null,
      joinedAt: raw.joinedAt,
    });
  }
}
