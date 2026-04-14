import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../../domain/models/workspace_invite.model';

export interface AcceptWorkspaceInviteService {
  acceptWorkspaceInvite(
    token: string,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel>;
}
