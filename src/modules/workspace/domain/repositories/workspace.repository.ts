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
    projects: number;
    openTasks: number;
    overdueTasks: number;
    members: number;
  };
  projects: {
    id: string;
    name: string;
    code: string | null;
    openTasks: number;
    doneTasks: number;
    totalTasks: number;
    progress: number;
    deadline: Date | null;
    status: 'ON_TRACK' | 'AT_RISK' | 'DUE_SOON';
    members: {
      userId: string;
      username: string | null;
    }[];
  }[];
  attentions: {
    type: 'OVERDUE' | 'DEADLINE_SOON' | 'UNASSIGNED';
    projectId: string | null;
    projectName: string | null;
    count: number;
    message: string;
  }[];
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
