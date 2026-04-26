export class TaskAssigneeResponseDto {
  userId: string;
  username: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

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

  assignees: TaskAssigneeResponseDto[];

  startAt: Date | null;
  dueAt: Date | null;
  completedAt: Date | null;

  estimateMinutes: number | null;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
