import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../../domain/models/workspace_invite.model';

export type AcceptWorkspaceInviteInput = {
  token: string;
  userId: string;
};

export interface AcceptWorkspaceInviteRepository {
  acceptWorkspaceInvite(
    input: AcceptWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel>;
}
