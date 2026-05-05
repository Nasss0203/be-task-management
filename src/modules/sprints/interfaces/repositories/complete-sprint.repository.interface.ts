import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export interface CompleteSprintRepository {
  completeSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null>;
}
