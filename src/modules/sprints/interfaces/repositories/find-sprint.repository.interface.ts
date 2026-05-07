import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';
<<<<<<< HEAD
import { SprintProgressResponseDto } from '../../dto/sprint-progress.response.dto';
import { FindSprintQuery } from '../find-sprint-query.interface';
=======
import { SprintStatus } from '../../domain/entities/sprint.entity';
>>>>>>> b7802d9 (feat(workspace): add soft delete and restore sprint)

export interface FindSprintRepository {
  existsByProjectIdAndName(
    projectId: string,
    name: string,
    manager?: EntityManager,
  ): Promise<boolean>;

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
export type SprintRestoreLookup = {
  id: string;
  workspaceId: string;
  projectId: string;
  deletedAt: Date | null;
  workspaceDeletedAt: Date | null;
  projectDeletedAt: Date | null;
  status: SprintStatus;
};
