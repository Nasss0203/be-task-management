import { EntityManager } from 'typeorm';

export interface MoveUnfinishedTasksToBacklogRepository {
  move(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    doneStatusId: string,
    manager?: EntityManager,
  ): Promise<number>;
}
