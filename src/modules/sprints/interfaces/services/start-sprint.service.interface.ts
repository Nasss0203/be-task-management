import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type StartSprintServiceInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
<<<<<<< HEAD
  startAt?: string;
  endAt?: string;
  name?: string;
  goal?: string;
=======
>>>>>>> admin
};

export interface StartSprintService {
  startSprint(
    input: StartSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel>;
}
