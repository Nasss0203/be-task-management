import { CreateWorkspaceInviteDto } from '../../dto/create-workspace_invite.dto';
import { WorkspaceInviteResponseDto } from '../../dto/response/workspace_invites-response.dto';

export interface InviteWorkspaceMemberApplication {
  invite(
    workspaceId: string,
    invitedBy: string,
    dto: CreateWorkspaceInviteDto,
  ): Promise<WorkspaceInviteResponseDto>;
}
