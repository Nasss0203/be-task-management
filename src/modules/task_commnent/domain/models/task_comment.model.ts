export class TaskCommentModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string,
    public readonly taskId: string,
    public readonly authorId: string,
    public readonly content: string,
    public readonly isEdited: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,

    public readonly authorName: string | null = null,
    public readonly authorEmail: string | null = null,
    public readonly authorAvatarUrl: string | null = null,
  ) {}
}
