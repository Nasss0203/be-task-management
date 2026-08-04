import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../../domain/models/workspace_invite.model';

export type DeclineWorkspaceInviteInput = {
  token: string;
  userId: string;
  email?: string;
};

export interface DeclineWorkspaceInviteService {
  declineWorkspaceInvite(
    input: DeclineWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel>;
}
