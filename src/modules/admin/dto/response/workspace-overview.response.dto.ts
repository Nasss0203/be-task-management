import { PlanTypeWorkspace } from 'src/modules/workspaces/domain/entities/workspace.entity';

export class WorkspaceOverviewResponseDto {
  id: string;
  name: string;
  slug: string;
  planType: PlanTypeWorkspace;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  projectCount: number;
  taskCount: number;
}
