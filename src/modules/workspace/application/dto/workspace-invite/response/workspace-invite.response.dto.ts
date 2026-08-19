import { WorkspaceInvite } from 'src/modules/workspace/domain/aggregates/workspace-invite/workspace-invite.aggregate';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceInviteType } from 'src/modules/workspace/domain/enums/workspace-invite-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export class WorkspaceInviteResponseDto {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string | null;
  type: WorkspaceInviteType;
  role_name: WorkspaceRole;
  invited_by: string;
  status: WorkspaceInviteStatus;
  accepted_at: Date | null;
  expires_at: Date;
  max_uses: number | null;
  used_count: number;
  created_at: Date;
  updated_at: Date;

  static fromDomain(invite: WorkspaceInvite): WorkspaceInviteResponseDto {
    return {
      id: invite.getId(),
      workspace_id: invite.getWorkspaceId(),
      user_id: invite.getUserId(),
      email: invite.getEmail(),
      type: invite.getType(),
      role_name: invite.getRoleName(),
      invited_by: invite.getInvitedBy(),
      status: invite.getStatus(),
      accepted_at: invite.getAcceptedAt(),
      expires_at: invite.getExpiresAt(),
      max_uses: invite.getMaxUses(),
      used_count: invite.getUsedCount(),
      created_at: invite.getCreatedAt(),
      updated_at: invite.getUpdatedAt(),
    };
  }
}
