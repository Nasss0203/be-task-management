export interface CreateProjectRepository {}
import { EntityManager } from 'typeorm';
import { ProjectModel } from '../../domain/models/projects.model';

export type SaveProjectInput = Pick<
  ProjectModel,
  'name' | 'key' | 'created_by' | 'workspace_id'
> &
  Partial<
    Pick<
      ProjectModel,
      'updated_at' | 'created_at' | 'id' | 'task_seq' | 'visibility'
    >
  >;

export interface CreateProjectRepository {
  save(
    project: ProjectModel | SaveProjectInput,
    manager?: EntityManager,
  ): Promise<ProjectModel>;
}
