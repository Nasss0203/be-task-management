export class SprintReportResponseDto {
  id: string;
  workspaceId: string;
  projectId: string;
  sprintId: string;
  sprintName: string;
  sprintGoal: string | null;
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  totalEstimate: number;
  completedEstimate: number;
  completedTaskIds: string[];
  incompleteTaskIds: string[];
  memberPerformance: Record<string, any>[];
  completedTaskDetails: Record<string, any>[];
  incompleteTaskDetails: Record<string, any>[];
  startAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
