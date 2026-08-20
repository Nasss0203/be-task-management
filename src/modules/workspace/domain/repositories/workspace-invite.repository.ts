import { WorkspaceInvite } from '../aggregates/workspace-invite/workspace-invite.aggregate';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface WorkspaceInviteRepository {
  save(
    invite: WorkspaceInvite,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite>;

  findByToken(
    token: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite | null>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite | null>;

  findByWorkspaceAndEmail(
    workspaceId: string,
    email: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite | null>;
}
