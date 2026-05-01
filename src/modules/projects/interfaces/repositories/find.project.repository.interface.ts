import { EntityManager } from 'typeorm';
import { ProjectModel } from '../../domain/models/projects.model';

export interface FindProjectRepository {
  findAllByWorkspaceId(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<ProjectModel[]>;

  findOneProjectById(
    projectId: string,
    manager?: EntityManager,
  ): Promise<ProjectModel | null>;
}
