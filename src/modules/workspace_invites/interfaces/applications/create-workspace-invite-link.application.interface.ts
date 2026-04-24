import { CreateWorkspaceInviteLinkDto } from '../../dto/create-workspace_invite.dto';
import { WorkspaceInviteLinkResponseDto } from '../../dto/response/workspace-invite-link-response.dto';

export interface CreateWorkspaceInviteLinkApplication {
  createLink(
    workspaceId: string,
    invitedBy: string,
    dto: CreateWorkspaceInviteLinkDto,
  ): Promise<WorkspaceInviteLinkResponseDto>;
}
