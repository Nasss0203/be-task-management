import { WorkspaceInvite } from '../aggregates/workspace-invite/workspace-invite.aggregate';
import { PersistenceContext } from './persistence-context';

export interface WorkspaceInviteRepository {
  save(
    invite: WorkspaceInvite,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite>;

  findByToken(
    token: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite | null>;
}
