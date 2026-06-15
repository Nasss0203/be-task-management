export class SprintReportsModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string,
    public readonly sprintId: string,
    public readonly sprintName: string,
    public readonly sprintGoal: string | null,
    public readonly totalTasks: number,
    public readonly completedTasks: number,
    public readonly incompleteTasks: number,
    public readonly totalEstimate: number,
    public readonly completedEstimate: number,
    public readonly completedTaskIds: string[],
    public readonly incompleteTaskIds: string[],
    public readonly memberPerformance: Record<string, any>[],
    public readonly completedTaskDetails: Record<string, any>[],
    public readonly incompleteTaskDetails: Record<string, any>[],
    public readonly startAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
