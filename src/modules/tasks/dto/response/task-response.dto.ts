export class TaskResponseDto {
  id: string;
  workspaceId: string;
  projectId: string;
  sprintId: string | null;

  projectSeq: number | null;
  title: string;
  description: string | null;

  statusId: string;
  statusName: string | null;

  priorityId: string | null;
  priorityName: string | null;

  createdBy: string;

  assigneeId: string | null;
  assigneeName: string | null;

  startAt: Date | null;
  dueAt: Date | null;
  completedAt: Date | null;

  estimateMinutes: number | null;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
