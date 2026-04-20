export class TaskStatusModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly position: number,
    public readonly color: string | null,
    public readonly isDone: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
