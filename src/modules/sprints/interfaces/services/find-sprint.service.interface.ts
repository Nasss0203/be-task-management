import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';
<<<<<<< HEAD
import { SprintProgressResponseDto } from '../../dto/sprint-progress.response.dto';
import { FindSprintQuery } from '../find-sprint-query.interface';
=======
import { SprintRestoreLookup } from '../repositories/find-sprint.repository.interface';
>>>>>>> b7802d9 (feat(workspace): add soft delete and restore sprint)

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

<<<<<<< HEAD
  getSprintProgress(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintProgressResponseDto | null>;
=======
  findDeletedSprints(
    workspaceId: string,
    projectId?: string,
  ): Promise<SprintsModel[]>;

  findOneSprintForRestore(
    workspaceId: string,
    projectId: string,
    sprintId: string,
  ): Promise<SprintRestoreLookup | null>;
>>>>>>> b7802d9 (feat(workspace): add soft delete and restore sprint)
}
