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
  | 'startAt'
  | 'estimateMinutes'
> &
  Partial<
    Pick<
      TaskModel,
      | 'id'
      | 'sprintId'
      | 'dueAt'
      | 'completedAt'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
    >
  >;

export interface CreateTaskRepository {
  save(input: SaveTaskInput, manager?: EntityManager): Promise<TaskModel>;

  saveMany(
    inputs: SaveTaskInput[],
    manager?: EntityManager,
  ): Promise<TaskModel[]>;

  getNextProjectSeq(
    workspaceId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<number>;
}
