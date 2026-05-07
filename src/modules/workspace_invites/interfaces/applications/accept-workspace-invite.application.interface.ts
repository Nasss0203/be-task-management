import { WorkspaceInviteResponseDto } from '../../dto/response/workspace_invites-response.dto';

export type AcceptWorkspaceInviteApplicationInput = {
  token: string;
  userId: string;
  email: string;
};

export interface AcceptWorkspaceInviteApplication {
  acceptWorkspaceInvite(
    input: AcceptWorkspaceInviteApplicationInput,
  ): Promise<WorkspaceInviteResponseDto>;
}
