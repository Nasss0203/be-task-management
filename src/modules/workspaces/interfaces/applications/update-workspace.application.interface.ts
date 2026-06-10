import { UpdateWorkspaceDto } from '../../dto/update-workspace.dto';
import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';

export type UpdateWorkspaceApplicationInput = {
  userId: string;
  workspaceId: string;
  dto: UpdateWorkspaceDto;
};

export interface UpdateWorkspaceApplication {
  update(input: UpdateWorkspaceApplicationInput): Promise<WorkspaceResponseDto>;
}
