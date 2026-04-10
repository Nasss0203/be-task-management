import { EntityManager } from 'typeorm';
export type WorkspaceAccessModel = {
  user_id: string;
  workspace_id: string;
  roles: string[];
  permissions: string[];
};

export interface AccessWorkspaceRepository {
  findWorkspaceAccess(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceAccessModel | null>;
}
