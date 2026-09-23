import {
  WorkspaceMember,
  WorkspaceMemberDetail,
} from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export class WorkspaceMemberResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  membership_type: WorkspaceMembershipType;
  role_name: WorkspaceRole | null;
  joinedAt: Date;
  lastOpenedAt?: Date;

  static fromDomain(member: WorkspaceMember): WorkspaceMemberResponseDto {
    return {
      id: member.getId(),
      workspace_id: member.getWorkspaceId(),
      user_id: member.getUserId(),
      membership_type: member.getMembershipType(),
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
  membership_type: WorkspaceMembershipType;
  role_name: WorkspaceRole | null;
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
      membership_type: member.getMembershipType(),
      role_name: member.getRole(),
      joinedAt: member.getJoinedAt(),
      lastOpenedAt: member.getLastOpenedAt(),
    };
  }
}
