import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';
import { SprintProgressResponseDto } from '../../dto/sprint-progress.response.dto';
import { FindSprintQuery } from '../find-sprint-query.interface';

export interface FindSprintService {
  findOneSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null>;

  findAllSprintByProject(
    workspaceId: string,
    projectId: string,
    query?: FindSprintQuery,
    manager?: EntityManager,
  ): Promise<SprintsModel[]>;

  findTasksBySprint(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null>;

  getSprintProgress(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintProgressResponseDto | null>;
}
