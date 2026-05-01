import { EntityManager } from 'typeorm';
import { ProjectModel } from '../../domain/models/projects.model';

export interface FindProjectService {
  findAllByWorkspaceId(workspaceId: string): Promise<ProjectModel[]>;

  findOneProjectById(
    projectId: string,
    manager?: EntityManager,
  ): Promise<ProjectModel | null>;
}
