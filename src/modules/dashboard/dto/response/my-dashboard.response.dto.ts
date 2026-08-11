export class DashboardGreetingResponseDto {
  displayName: string;
  todayPriorityCount: number;
  date: string;
  timezone: string;
}

export class DashboardFocusResponseDto {
  title: string;
  message: string;
  deepWorkMinutes: number;
  reviewTaskCount: number;
  momentumPercent: number | null;
  dayProgressPercent: number;
  completedThisWeek: number;
  targetThisWeek: number;
  remainingTasks: number;
  overdueTasks: number;
}

export class DashboardRhythmBlockResponseDto {
  time: string;
  title: string;
  subtitle: string;
  taskId: string;
}

export class DashboardStatsResponseDto {
  myTasks: number;
  priorityToday: number;
  upcoming: number;
  upcomingWindowDays: number;
  overdue: number;
  completedThisWeek: number;
  weeklyGoalPercent: number;
}

export class DashboardTaskResponseDto {
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
  completedAt: Date | null;
  estimateMinutes: number | null;
  progressPercent: number | null;
}

export class DashboardDeadlineResponseDto extends DashboardTaskResponseDto {
  remainingLabel: string;
}

export class DashboardWorkspaceResponseDto {
  id: string;
  name: string;
  slug: string;
  projectCount: number;
  openTaskCount: number;
  completedTaskCount: number;
  lastOpenedAt: Date | null;
}

export class DashboardActivityResponseDto {
  id: string;
  workspaceId: string;
  projectId: string | null;
  action: string;
  message: string;
  createdAt: Date;
}

export class DashboardSuggestionResponseDto {
  type: string;
  message: string;
}

export class MyDashboardResponseDto {
  greeting: DashboardGreetingResponseDto;
  focus: DashboardFocusResponseDto;
  rhythmBlocks: DashboardRhythmBlockResponseDto[];
  recentDeadlines: DashboardDeadlineResponseDto[];
  recentCompletedTasks: DashboardTaskResponseDto[];
  stats: DashboardStatsResponseDto;
  priorityTasks: DashboardTaskResponseDto[];
  recentWorkspaces: DashboardWorkspaceResponseDto[];
  recentActivities: DashboardActivityResponseDto[];
  suggestions: DashboardSuggestionResponseDto[];
}
