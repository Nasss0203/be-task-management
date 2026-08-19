import {
  WorkspaceMember,
  WorkspaceMemberDetail,
} from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export class WorkspaceMemberResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  role_name: WorkspaceRole;
  joinedAt: Date;
  lastOpenedAt?: Date;

  static fromDomain(member: WorkspaceMember): WorkspaceMemberResponseDto {
    return {
      id: member.getId(),
      workspace_id: member.getWorkspaceId(),
      user_id: member.getUserId(),
      role_name: member.getRole(),
      joinedAt: member.getJoinedAt(),
      lastOpenedAt: member.getLastOpenedAt() ?? undefined,
    };
  }
}

export class WorkspaceMemberDetailResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role_name: WorkspaceRole;
  lastOpenedAt: Date | null;
  joinedAt: Date | null;

  static fromDomain(
    member: WorkspaceMemberDetail,
  ): WorkspaceMemberDetailResponseDto {
    return {
      id: member.getId(),
      workspace_id: member.getWorkspaceId(),
      user_id: member.getUserId(),
      full_name: member.getFullName(),
      email: member.getEmail(),
      avatar_url: member.getAvatarUrl(),
      role_name: member.getRole(),
      joinedAt: member.getJoinedAt(),
      lastOpenedAt: member.getLastOpenedAt(),
    };
  }
}
