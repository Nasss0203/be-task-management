import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export interface CancelSprintRepository {
  cancelSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null>;
}
