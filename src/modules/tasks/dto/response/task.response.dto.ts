export class TaskResponseDto {
  id: string;
  workspaceId: string;
  projectId: string;
  boardId: string;
  sprintId?: string | null;
  projectSeq: number;
  title: string;
  description?: string | null;
  statusId: string;
  priorityId?: string | null;
  reporterId: string;
  dueAt?: Date | null;
  estimateMinutes?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}
