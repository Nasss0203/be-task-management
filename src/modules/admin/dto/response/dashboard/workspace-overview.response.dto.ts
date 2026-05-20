import { PlanTypeWorkspace } from 'src/modules/workspaces/domain/entities/workspace.entity';

export type AdminWorkspaceStatus = 'ACTIVE' | 'DELETED';

export type ProjectHealthStatus = 'ON_TRACK' | 'AT_RISK' | 'DUE_SOON';

export type AttentionType = 'OVERDUE' | 'DEADLINE_SOON' | 'UNASSIGNED';

export class WorkspaceOverviewMetricDto {
  projects: number;
  openTasks: number;
  overdueTasks: number;
  members: number;
}

export class ProjectOverviewMemberDto {
  userId: string;
  username: string | null;
}

export class ProjectOverviewItemDto {
  id: string;
  name: string;
  code: string | null;

  openTasks: number;
  doneTasks: number;
  totalTasks: number;

  progress: number;

  deadline: Date | null;
  status: ProjectHealthStatus;

  members: ProjectOverviewMemberDto[];
}

export class WorkspaceAttentionItemDto {
  type: AttentionType;
  projectId: string | null;
  projectName: string | null;
  count: number;
  message: string;
}

export class WorkspaceOverviewResponseDto {
  workspaceId: string;
  metrics: WorkspaceOverviewMetricDto;
  projects: ProjectOverviewItemDto[];
  attentions: WorkspaceAttentionItemDto[];
}

export class AdminWorkspaceItemResponseDto {
  id: string;
  name: string;
  slug: string;

  plan: PlanTypeWorkspace;
  status: AdminWorkspaceStatus;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  ownerName: string | null;
  ownerEmail: string | null;

  membersCount: number;
  projectsCount: number;
  boardsCount: number;
  tasksCount: number;
}
