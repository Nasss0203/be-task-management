export class TaskPriorityResponseDto {
  id: string;

  workspaceId: string;

  projectId: string;

  name: string;

  level: number;

  color?: string | null;

  createdAt?: Date;

  updatedAt?: Date;
}
