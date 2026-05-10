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
  boardCount: number;
}

export class AdminWorkspaceItemResponseDto {
  id: string;
  name: string;
  slug: string;
  plan: PlanTypeWorkspace;
  createdAt: Date;
  updatedAt: Date;

  owner?: string;
  membersCount: number;
  projectsCount: number;
  tasksCount: number;
  userCount: number;
}
