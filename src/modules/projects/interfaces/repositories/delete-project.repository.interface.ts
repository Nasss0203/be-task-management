import { EntityManager } from 'typeorm';

export interface DeleteProjectRepository {
  softDeleteProject(
    input: {
      projectId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void>;

  restoreProject(
    input: {
      projectId: string;
    },
    manager?: EntityManager,
  ): Promise<void>;
}
