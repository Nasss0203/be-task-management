import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type CompleteSprintServiceInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
};

export interface CompleteSprintService {
  completeSprint(
    input: CompleteSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel>;
}
