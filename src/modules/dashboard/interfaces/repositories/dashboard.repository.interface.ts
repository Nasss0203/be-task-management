import { ActivityAction } from 'src/modules/activity/domain/entities/activity.entity';

export interface DashboardDateRange {
  now: Date;
  dayStart: Date;
  dayEnd: Date;
  weekStart: Date;
  weekEnd: Date;
  upcomingEnd: Date;
}

export interface DashboardTaskStatsRow {
  myTasks: number;
  todayTasks: number;
  upcoming: number;
  overdue: number;
  completedToday: number;
  completedThisWeek: number;
  remainingThisWeek: number;
  reviewTaskCount: number;
  deepWorkMinutes: number;
}

export interface DashboardTaskRow {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  workspaceName: string;
  projectName: string;
  priorityName: string | null;
  priorityLevel: number | null;
  statusName: string | null;
  statusIsDone: boolean;
  dueAt: Date | null;
  startAt: Date | null;
  estimateMinutes: number | null;
}

export interface DashboardWorkspaceRow {
  id: string;
  name: string;
  slug: string;
  projectCount: number;
  openTaskCount: number;
  lastOpenedAt: Date | null;
}

export interface DashboardActivityRow {
  id: string;
  workspaceId: string;
  projectId: string | null;
  action: ActivityAction;
  field: string | null;
  metadata: Record<string, unknown> | null;
  newValue: unknown | null;
  createdAt: Date;
}

export interface DashboardRepository {
  getTaskStats(
    userId: string,
    range: DashboardDateRange,
  ): Promise<DashboardTaskStatsRow>;

  findPriorityTasks(
    userId: string,
    range: DashboardDateRange,
    limit: number,
  ): Promise<DashboardTaskRow[]>;

  findRecentDeadlines(
    userId: string,
    range: DashboardDateRange,
    limit: number,
  ): Promise<DashboardTaskRow[]>;

  findRecentWorkspaces(
    userId: string,
    limit: number,
  ): Promise<DashboardWorkspaceRow[]>;

  findRecentActivities(
    userId: string,
    limit: number,
  ): Promise<DashboardActivityRow[]>;

  countUnassignedTasks(userId: string): Promise<number>;
}
