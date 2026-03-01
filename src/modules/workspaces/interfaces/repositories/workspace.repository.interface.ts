import { WorkspaceModel } from '../../domain/models/workspaces.model';

export type SaveWorkspaceInput = Pick<
  WorkspaceModel,
  'name' | 'slug' | 'planType'
> &
  Partial<Pick<WorkspaceModel, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export interface WorkspaceRepository {
  existsBySlug(slug: string): Promise<boolean>;
  save(workspace: WorkspaceModel | SaveWorkspaceInput): Promise<WorkspaceModel>;
}
