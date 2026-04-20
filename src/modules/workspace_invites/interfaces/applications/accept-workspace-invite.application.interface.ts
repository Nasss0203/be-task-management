import { WorkspaceInviteResponseDto } from '../../dto/response/workspace_invites-response.dto';

export interface AcceptWorkspaceInviteApplication {
  acceptWorkspaceInvite(
    token: string,
    userId: string,
  ): Promise<WorkspaceInviteResponseDto>;
}
