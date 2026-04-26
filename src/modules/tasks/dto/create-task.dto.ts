export class CreateTaskDto {
  workspaceId: string;
  projectId: string;
  sprintId?: string | null;

  title: string;
  description?: string | null;
  createdBy: string;

  statusId: string;
  priorityId?: string | null;

  startAt?: Date | null;
  dueAt?: Date | null;
  completedAt?: Date | null;

  estimateMinutes?: number | null;
}
