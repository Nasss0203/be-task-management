import { EntityManager } from 'typeorm';
import { WorkspaceModel } from '../../domain/models/workspaces.model';

export type SaveWorkspaceTemplateInput = Pick<
  WorkspaceModel,
  'name' | 'slug' | 'planType'
>;

export interface CreateWorkspaceTemplateRepository {
  create(
    workspace: SaveWorkspaceTemplateInput,
    manager?: EntityManager,
  ): Promise<WorkspaceModel>;
}
