import { EntityManager } from 'typeorm';
import { WorkspaceModel } from '../../domain/models/workspaces.model';

export type SaveWorkspaceInput = Pick<
  WorkspaceModel,
  'name' | 'slug' | 'planType'
> &
  Partial<Pick<WorkspaceModel, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export interface CreateWorkspaceMultiRepository {
  existsBySlug(slug: string, manager?: EntityManager): Promise<boolean>;
  save(
    workspace: WorkspaceModel | SaveWorkspaceInput,
    manager?: EntityManager,
  ): Promise<WorkspaceModel>;
}

