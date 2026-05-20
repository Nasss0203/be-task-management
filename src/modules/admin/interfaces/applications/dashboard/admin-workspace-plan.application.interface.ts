import { WorkspacePlanResponseDto } from '../../../dto/response/dashboard/workspace-plan.response.dto';

export interface AdminWorkspacePlanApplication {
  getWorkspacePlan(): Promise<WorkspacePlanResponseDto[]>;
}
