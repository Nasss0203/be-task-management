export class CreateTaskDto {
  workspaceId: string;
  projectId: string;
  sprintId?: string | null;

  projectSeq: number;

  title: string;
  description?: string | null;

  statusId: string;
  priorityId?: string | null;

  createdBy: string;
  assigneeId?: string | null;

  startAt?: Date | null;
  dueAt?: Date | null;
  completedAt?: Date | null;

  estimateMinutes?: number | null;
}
