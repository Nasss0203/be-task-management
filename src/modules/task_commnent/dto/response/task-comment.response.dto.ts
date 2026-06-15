export class TaskCommentResponseDto {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string;
  authorId: string;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;

  authorName: string | null;
  authorEmail: string | null;
  authorAvatarUrl: string | null;
}
