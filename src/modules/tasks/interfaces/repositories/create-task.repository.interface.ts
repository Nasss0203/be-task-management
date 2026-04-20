import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export type SaveTaskInput = Pick<
  TaskModel,
  | 'workspaceId'
  | 'projectId'
  | 'projectSeq'
  | 'title'
  | 'statusId'
  | 'createdBy'
  | 'description'
  | 'priorityId'
  | 'assigneeId'
  | 'startAt'
  | 'estimateMinutes'
> &
  Partial<
    Pick<
      TaskModel,
      'id' | 'sprintId' | 'dueAt' | 'completedAt' | 'createdAt' | 'updatedAt'
    >
  >;

export interface CreateTaskRepository {
  save(
    task: TaskModel | SaveTaskInput,
    manager?: EntityManager,
  ): Promise<TaskModel>;

  saveMany(
    tasks: Array<TaskModel | SaveTaskInput>,
    manager?: EntityManager,
  ): Promise<TaskModel[]>;
}
