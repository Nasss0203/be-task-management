export class TaskModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string,
    public readonly sprintId: string | null = null,
    public readonly projectSeq: number | null = null,
    public readonly title: string,
    public readonly description: string | null = null,

    public readonly statusId: string,
    public readonly statusName: string | null = null,

    public readonly priorityId: string | null = null,
    public readonly priorityName: string | null = null,

    public readonly createdBy: string,

    public readonly assigneeId: string | null = null,
    public readonly assigneeName: string | null = null,

    public readonly startAt: Date | null = null,
    public readonly dueAt: Date | null = null,
    public readonly completedAt: Date | null = null,

    public readonly estimateMinutes: number | null = null,

    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
  ) {}
}
