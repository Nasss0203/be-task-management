import { WorkspacePlanResponseDto } from '../../../dto/response/dashboard/workspace-plan.response.dto';

export interface AdminWorkspacePlanService {
  getWorkspacePlan(): Promise<WorkspacePlanResponseDto[]>;
}
