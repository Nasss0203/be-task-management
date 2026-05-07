import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export interface StartSprintRepository {
  startSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null>;
}
