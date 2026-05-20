import { WorkspacePlanResponseDto } from '../../../dto/response/dashboard/workspace-plan.response.dto';

export interface AdminWorkspacePlanRepository {
  getWorkspacePlan(): Promise<WorkspacePlanResponseDto[]>;
}
