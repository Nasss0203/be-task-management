export class TaskPriorityModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly level: number,
    public readonly color: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
