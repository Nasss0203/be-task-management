import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type StartSprintServiceInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
};

export interface StartSprintService {
  startSprint(
    input: StartSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel>;
}
