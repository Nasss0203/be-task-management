import { EntityManager } from 'typeorm';
import { Sprint, SprintStatus } from '../../domain/entities/sprint.entity';
import { SprintsModel } from '../../domain/models/sprints.model';
import { SprintProgressResponseDto } from '../../dto/sprint-progress.response.dto';
import { FindSprintQuery } from '../find-sprint-query.interface';

export interface FindSprintRepository {
  findActiveSprintsDueSoon(
    days: number,
    manager?: EntityManager,
  ): Promise<Sprint[]>;

  findActiveSprintsOverdue(manager?: EntityManager): Promise<Sprint[]>;

  existsByProjectIdAndName(
    projectId: string,
    name: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  getNextDefaultSprintName(
    projectId: string,
    manager?: EntityManager,
  ): Promise<string>;

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
  findDeletedSprints(
    workspaceId: string,
    projectId?: string,
  ): Promise<SprintsModel[]>;

  findOneSprintForRestore(
    workspaceId: string,
    projectId: string,
    sprintId: string,
  ): Promise<SprintRestoreLookup | null>;
}
export type SprintRestoreLookup = {
  id: string;
  workspaceId: string;
  projectId: string;
  deletedAt: Date | null;
  workspaceDeletedAt: Date | null;
  projectDeletedAt: Date | null;
  status: SprintStatus;
};
