import { WorkspaceModel } from '../../domain/models/workspaces.model';

export interface WorkspaceRepository {
  existsBySlug(slug: string): Promise<boolean>;
  save(workspace: WorkspaceModel): Promise<WorkspaceModel>;
}
