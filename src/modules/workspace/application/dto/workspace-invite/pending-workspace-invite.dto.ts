import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

export class PendingWorkspaceInviteDto {
  id: string;
  workspaceId: string;
  userId: string | null;
  email: string | null;
  roleName: WorkspaceRole;
  status: WorkspaceInviteStatus;
  expiresAt: Date;
  createdAt: Date;
}
