import { EntityManager } from 'typeorm';

export interface FindPermissionService {
  findPermissionsByUserAndWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<string[]>;
}
