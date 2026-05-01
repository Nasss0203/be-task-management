import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export interface FindSprintService {
  findOneSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null>;

  findAllSprintByProject(
    workspaceId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel[]>;
}
