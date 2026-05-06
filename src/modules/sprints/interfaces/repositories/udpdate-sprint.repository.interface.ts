import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type UpdateSprintRepositoryInput = {
  id: string;
  workspaceId: string;
  projectId: string;
  name?: string;
  goal?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
};

export interface UpdateSprintRepository {
  updateSprint(
    input: UpdateSprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<SprintsModel | null>;
}
