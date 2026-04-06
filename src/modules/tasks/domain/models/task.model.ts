export class TaskModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string,
    public readonly sprintId: string | null = null,
    public readonly projectSeq: number,
    public readonly title: string,
    public readonly description: string | null,
    public readonly statusId: string,
    public readonly statusName: string | null,
    public readonly priorityId: string | null,
    public readonly priorityName: string | null,
    public readonly reporterId: string,
    public readonly dueAt?: Date | null,
    public readonly estimateMinutes?: number | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
