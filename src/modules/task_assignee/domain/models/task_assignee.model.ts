export class TaskAssigneeModel {
  constructor(
    public readonly id: string,
    public readonly taskId: string,
    public readonly userId: string,
    public readonly username: string | null,

    public readonly assignedBy: string | null,
    public readonly assignedByUsername: string | null,

    public readonly assignedAt: Date,
  ) {}
}
