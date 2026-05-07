import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../../domain/models/workspace_invite.model';

export type AcceptWorkspaceInviteInput = {
  token: string;
  userId: string;
  email: string;
};

export interface AcceptWorkspaceInviteService {
  acceptWorkspaceInvite(
    input: AcceptWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel>;
}
