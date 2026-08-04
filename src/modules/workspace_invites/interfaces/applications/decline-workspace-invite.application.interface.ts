import { WorkspaceInviteResponseDto } from '../../dto/response/workspace_invites-response.dto';

export type DeclineWorkspaceInviteApplicationInput = {
  token: string;
  userId: string;
  email?: string;
};

export interface DeclineWorkspaceInviteApplication {
  declineWorkspaceInvite(
    input: DeclineWorkspaceInviteApplicationInput,
  ): Promise<WorkspaceInviteResponseDto>;
}
