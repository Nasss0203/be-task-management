export class TaskAssigneeResponseDto {
  id: string;
  taskId: string;
  userId: string;
  username: string | null;

  assignedBy: string | null;
  assignedByUsername: string | null;

  assignedAt: Date;
}

export type DeleteTaskAssigneeResponseDto = {
  taskId: string;
  userId: string;
  unassigned: boolean;
};
