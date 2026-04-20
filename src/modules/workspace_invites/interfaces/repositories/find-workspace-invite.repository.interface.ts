import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../../domain/models/workspace_invite.model';

export interface FindWorkspaceInviteRepository {
  findByToken(
    token: string,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel | null>;
}
