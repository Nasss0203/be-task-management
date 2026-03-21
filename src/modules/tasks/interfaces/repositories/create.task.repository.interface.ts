import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export type SaveTaskInput = Pick<
  TaskModel,
  | 'boardId'
  | 'description'
  | 'priorityId'
  | 'projectId'
  | 'estimateMinutes'
  | 'projectSeq'
  | 'reporterId'
  | 'statusId'
  | 'title'
  | 'workspaceId'
> &
  Partial<
    Pick<TaskModel, 'updatedAt' | 'createdAt' | 'id' | 'sprintId' | 'dueAt'>
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
