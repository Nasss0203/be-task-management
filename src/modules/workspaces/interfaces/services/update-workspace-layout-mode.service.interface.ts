import { WorkspaceLayoutMode } from '../../domain/entities/workspace.entity';
import { WorkspaceModel } from '../../domain/models/workspaces.model';

export type UpdateWorkspaceLayoutModeInput = {
  userId: string;
  workspaceId: string;
  layoutMode: WorkspaceLayoutMode;
};

export interface UpdateWorkspaceLayoutModeService {
  updateLayoutMode(
    input: UpdateWorkspaceLayoutModeInput,
  ): Promise<WorkspaceModel>;
}
