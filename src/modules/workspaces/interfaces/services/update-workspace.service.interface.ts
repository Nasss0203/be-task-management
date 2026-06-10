import { WorkspaceModel } from '../../domain/models/workspaces.model';

export type UpdateWorkspaceInput = {
  userId: string;
  workspaceId: string;
  name?: string;
};

export interface UpdateWorkspaceService {
  update(input: UpdateWorkspaceInput): Promise<WorkspaceModel>;
}
