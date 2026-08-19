import { WorkspaceInvite } from 'src/modules/workspace/domain/aggregates/workspace-invite/workspace-invite.aggregate';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export class WorkspaceInviteLinkResponseDto {
  id: string;
  workspace_id: string;
  role_name: WorkspaceRole;
  token: string;
  invite_url: string;
  expires_at: Date;
  max_uses: number | null;
  used_count: number;

  static fromDomain(
    invite: WorkspaceInvite,
    inviteUrl: string,
  ): WorkspaceInviteLinkResponseDto {
    return {
      id: invite.getId(),
      workspace_id: invite.getWorkspaceId(),
      role_name: invite.getRoleName(),
      token: invite.getToken(),
      invite_url: inviteUrl,
      expires_at: invite.getExpiresAt(),
      max_uses: invite.getMaxUses(),
      used_count: invite.getUsedCount(),
    };
  }
}
