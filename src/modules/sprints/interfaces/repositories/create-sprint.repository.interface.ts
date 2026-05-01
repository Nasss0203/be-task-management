import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type SaveSprintInput = Pick<
  SprintsModel,
  'workspaceId' | 'projectId' | 'name' | 'createdBy'
> &
  Partial<Pick<SprintsModel, 'goal' | 'status' | 'startAt' | 'endAt'>>;

export interface CreateSprintRepository {
  save(input: SaveSprintInput, manager?: EntityManager): Promise<SprintsModel>;
}
