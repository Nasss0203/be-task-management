import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

<<<<<<< HEAD
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
=======
export interface StartSprintRepository {
  startSprint(
    sprintId: string,
>>>>>>> admin
    manager?: EntityManager,
  ): Promise<SprintsModel | null>;
}
