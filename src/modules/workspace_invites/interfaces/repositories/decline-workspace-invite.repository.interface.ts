import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../../domain/models/workspace_invite.model';

export type DeclineWorkspaceInviteInput = {
  token: string;
};

export interface DeclineWorkspaceInviteRepository {
  declineWorkspaceInvite(
    input: DeclineWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel>;
}
