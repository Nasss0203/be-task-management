import { WorkspaceResponseDto } from 'src/modules/workspaces/dto/response/workspaces.response.dto';
import { UpdateWorkspacePlanDto } from '../../dto/update-workspace-plan.dto';

export interface AdminUpdateWorkspacePlanApplication {
  updatePlan(
    workspaceId: string,
    dto: UpdateWorkspacePlanDto,
  ): Promise<WorkspaceResponseDto>;
}
