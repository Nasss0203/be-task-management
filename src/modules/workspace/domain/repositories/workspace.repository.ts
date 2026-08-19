import { Workspace } from '../aggregates/workspace/workspace.aggregate';
import { PersistenceContext } from './persistence-context';

export type WorkspaceAccess = {
  userId: string;
  workspaceId: string;
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
