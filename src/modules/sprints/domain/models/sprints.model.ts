import { TaskModel } from 'src/modules/tasks/domain/models/task.model';
import { SprintStatus } from '../entities/sprint.entity';

export class SprintsModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly goal: string | null,
    public readonly status: SprintStatus,
    public readonly startAt: Date | null,
    public readonly endAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
    public readonly deletedBy: string | null,

    public readonly tasks?: TaskModel[],
  ) {}
}
