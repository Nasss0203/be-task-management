import type { TaskPositionContext } from '../../constants/task-position-context.constant';

export class TaskPositionModel {
  constructor(
    public readonly id: string,
    public readonly taskId: string,
    public readonly context: TaskPositionContext,
    public readonly contextId: string,
    public readonly position: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
