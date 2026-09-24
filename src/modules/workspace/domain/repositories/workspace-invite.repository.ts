import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { WorkspaceInvite } from '../aggregates/workspace-invite/workspace-invite.aggregate';

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

  findPendingByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite[]>;
}
