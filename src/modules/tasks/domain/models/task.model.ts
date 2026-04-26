export type TaskAssigneeModel = {
  userId: string;
  username: string | null;
};

export class TaskModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string,
    public readonly projectSeq: number | null,
    public readonly title: string,
    public readonly statusId: string,
    public readonly createdBy: string,

    public readonly sprintId: string | null = null,
    public readonly description: string | null = null,

    public readonly statusName: string | null = null,

    public readonly priorityId: string | null = null,
    public readonly priorityName: string | null = null,

    public readonly assignees: TaskAssigneeModel[] = [],

    public readonly startAt: Date | null = null,
    public readonly dueAt: Date | null = null,
    public readonly completedAt: Date | null = null,

    public readonly estimateMinutes: number | null = null,

    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
  ) {}
}
