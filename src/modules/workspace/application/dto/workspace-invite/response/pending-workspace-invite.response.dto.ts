import { WorkspaceInvite } from 'src/modules/workspace/domain/aggregates/workspace-invite/workspace-invite.aggregate';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export class PendingWorkspaceInviteResponseDto {
  id: string;
  workspaceId: string;
  userId: string | null;
  email: string | null;
  roleName: WorkspaceRole;
  status: WorkspaceInviteStatus;
  expiresAt: Date;
  createdAt: Date;

  static fromDomain(
    invite: WorkspaceInvite,
  ): PendingWorkspaceInviteResponseDto {
    return {
      id: invite.getId(),
      workspaceId: invite.getWorkspaceId(),
      userId: invite.getUserId(),
      email: invite.getEmail(),
      roleName: invite.getRoleName(),
      status: invite.getStatus(),
      expiresAt: invite.getExpiresAt(),
      createdAt: invite.getCreatedAt(),
    };
  }
}
