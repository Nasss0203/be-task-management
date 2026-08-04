import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';
import { UpdateWorkspaceLayoutModeDto } from '../../dto/update-workspace-layout-mode.dto';

export type UpdateWorkspaceLayoutModeApplicationInput = {
  userId: string;
  workspaceId: string;
  dto: UpdateWorkspaceLayoutModeDto;
};

export interface UpdateWorkspaceLayoutModeApplication {
  updateLayoutMode(
    input: UpdateWorkspaceLayoutModeApplicationInput,
  ): Promise<WorkspaceResponseDto>;
}
