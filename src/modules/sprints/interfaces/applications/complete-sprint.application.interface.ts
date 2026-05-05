import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type CompleteSprintApplicationInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  userId: string;
};

export interface CompleteSprintApplication {
  complete(
    input: CompleteSprintApplicationInput,
    manager?: EntityManager,
  ): Promise<SprintsModel>;
}
