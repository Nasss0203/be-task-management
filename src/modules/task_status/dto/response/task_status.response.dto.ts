export class TaskStatusResponseDto {
  id: string;

  workspaceId: string;

  projectId: string;

  name: string;

  position: number;

  color?: string | null;

  isDone: boolean;

  createdAt: Date;

  updatedAt: Date;
}
