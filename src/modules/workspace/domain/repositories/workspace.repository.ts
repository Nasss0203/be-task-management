import { Workspace } from '../aggregates/workspace/workspace.aggregate';
import { WorkspaceMembershipType } from '../enums/workspace-membership-type.enum';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export type WorkspaceAccess = {
  userId: string;
  workspaceId: string;
  membershipType: WorkspaceMembershipType;
  roles: string[];
  permissions: string[];
};

export type WorkspaceOverview = {
  workspaceId: string;
  metrics: {
    members: number;
  };
};

export interface WorkspaceRepository {
  existsBySlug(slug: string, context?: PersistenceContext): Promise<boolean>;

  save(workspace: Workspace, context?: PersistenceContext): Promise<Workspace>;

  findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<Workspace[]>;

  findByUserIdAndWorkspaceId(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Workspace | null>;

  findAccess(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceAccess | null>;

  findOverview(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceOverview>;

  findDeletedByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<Workspace[]>;

  findDeletedByUserIdAndWorkspaceId(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Workspace | null>;
}
