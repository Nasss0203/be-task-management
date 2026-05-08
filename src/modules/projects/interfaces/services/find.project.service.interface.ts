import { EntityManager } from 'typeorm';
import { ProjectModel } from '../../domain/models/projects.model';
import { FindProjectFilter } from '../find-project-filter.type';
import { ProjectRestoreLookup } from '../repositories/find.project.repository.interface';
export interface FindProjectService {
  findAllByWorkspaceId(
    workspaceId: string,
    filter?: FindProjectFilter,
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
