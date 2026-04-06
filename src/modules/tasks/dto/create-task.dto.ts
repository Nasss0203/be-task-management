export class CreateTaskDto {
  workspaceId: string;
  projectId: string;
  sprintId?: string | null;
  projectSeq: number;
  title: string;
  description: string | null;
  statusId: string;
  priorityId: string;
  reporterId: string;
  dueAt?: Date | null;
  estimateMinutes?: number | null;
}
