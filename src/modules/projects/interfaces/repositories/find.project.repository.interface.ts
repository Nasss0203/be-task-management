import { EntityManager } from 'typeorm';
import { ProjectModel } from '../../domain/models/projects.model';
import { FindProjectFilter } from '../find-project-filter.type';

export interface FindProjectRepository {
  findAllByWorkspaceId(
    workspaceId: string,
    filter?: FindProjectFilter,
    manager?: EntityManager,
  ): Promise<ProjectModel[]>;

  findOneProjectById(
    projectId: string,
    manager?: EntityManager,
  ): Promise<ProjectModel | null>;

  findDeletedProjects(workspaceId: string): Promise<ProjectModel[]>;

  findOneProjectForRestore(
    workspaceId: string,
    projectId: string,
  ): Promise<ProjectRestoreLookup | null>;

  existsActiveProjectKey(
    workspaceId: string,
    key: string,
    excludeProjectId?: string,
  ): Promise<boolean>;
}

export type ProjectRestoreLookup = {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  deletedAt: Date | null;
  workspaceDeletedAt: Date | null;
};
