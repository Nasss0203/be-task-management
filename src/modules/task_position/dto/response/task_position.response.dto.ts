import type { TaskPositionContext } from '../../constants/task-position-context.constant';

export class TaskPositionResponseDto {
  id: string;

  taskId: string;

  context: TaskPositionContext;

  contextId: string;

  position: number;

  createdAt: Date;

  updatedAt: Date;
}
