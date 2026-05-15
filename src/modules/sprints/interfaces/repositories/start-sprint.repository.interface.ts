import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type StartSprintRepositoryInput = {
  sprintId: string;
  startAt: Date;
  endAt?: Date | null;
  name?: string;
  goal?: string | null;
};

export interface StartSprintRepository {
  startSprint(
    input: StartSprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<SprintsModel | null>;
}
