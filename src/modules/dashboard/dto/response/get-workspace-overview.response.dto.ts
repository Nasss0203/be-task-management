export type WorkspaceOverviewProjectHealth =
  | 'on-track'
  | 'at-risk'
  | 'almost-done';

export type WorkspaceOverviewAttentionType =
  | 'overdue'
  | 'deadline-soon'
  | 'unassigned';

export type WorkspaceOverviewDeadlineType = 'task' | 'sprint';

export class WorkspaceOverviewMetricsDto {
  projects: {
    count: number;
    newThisWeek: number;
  };

  openTasks: {
    count: number;
    assignedToMe: number;
  };

  overdueTasks: {
    count: number;
    assignedToMe: number;
  };

  members: {
    count: number;
    activeRecently: number;
  };
}

export class WorkspaceOverviewProjectMemberDto {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export class WorkspaceOverviewProjectDto {
  id: string;
  name: string;
  code: string;
  health: WorkspaceOverviewProjectHealth;
  progress: number;
  totalTasks: number;
  openTasks: number;
  doneTasks: number;
  overdueTasks: number;
  deadline: string | null;
  members: WorkspaceOverviewProjectMemberDto[];
}

export class WorkspaceOverviewTaskStatusItemDto {
  statusId: string;
  name: string;
  count: number;
  isDone: boolean;
  color: string | null;
  position: number | null;
}

export class WorkspaceOverviewTaskStatusDto {
  total: number;
  items: WorkspaceOverviewTaskStatusItemDto[];
}

export class WorkspaceOverviewAttentionItemDto {
  id: string;
  type: WorkspaceOverviewAttentionType;
  count: number;
  projectId: string | null;
  projectName: string | null;
}

export class WorkspaceOverviewMyTaskDto {
  id: string;
  title: string;
  dueAt: string | null;
  daysRemaining: number | null;
  isOverdue: boolean;
  project: {
    id: string;
    name: string;
  };
  status: {
    id: string;
    name: string;
    isDone: boolean;
    color: string | null;
  };
  priority: {
    id: string;
    name: string;
    level: number | null;
    color: string | null;
  } | null;
}

export class WorkspaceOverviewActivityDto {
  id: string;
  actor: {
    id: string | null;
    name: string;
    avatarUrl: string | null;
  };
  action: string;
  entityType: string;
  entityId: string | null;
  targetName: string | null;
  field: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export class WorkspaceOverviewDeadlineDto {
  id: string;
  title: string;
  type: WorkspaceOverviewDeadlineType;
  deadline: string;
  daysRemaining: number;
  isUrgent: boolean;
  projectId: string;
}

export class GetWorkspaceOverviewResponseDto {
  metrics: WorkspaceOverviewMetricsDto;
  projects: WorkspaceOverviewProjectDto[];
  taskStatus: WorkspaceOverviewTaskStatusDto;
  attentionItems: WorkspaceOverviewAttentionItemDto[];
  myTasks: WorkspaceOverviewMyTaskDto[];
  activities: WorkspaceOverviewActivityDto[];
  upcomingDeadlines: WorkspaceOverviewDeadlineDto[];
}
