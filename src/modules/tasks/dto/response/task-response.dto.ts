export class TaskAssigneeSummaryResponseDto {
  userId: string;
  username: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export class TaskResponseDto {
  id: string;
  workspaceId: string;
  projectId: string;
  parentTaskId: string | null;
  sprintId: string | null;
  sprintName: string | null;

  projectSeq: number | null;
  title: string | null;
  description: string | null;

  statusId: string;
  statusName: string | null;

  priorityId: string | null;
  priorityName: string | null;

  createdBy: string;

  assignees: TaskAssigneeSummaryResponseDto[];

  startAt: Date | null;
  dueAt: Date | null;
  completedAt: Date | null;

  estimateMinutes: number | null;
  position: string | null;
  subtasks: TaskResponseDto[];

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export class PaginatedTaskResponseDto {
  data: TaskResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
