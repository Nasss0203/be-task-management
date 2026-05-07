import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type UpdateSprintServiceInput = {
  id: string;
  workspaceId: string;
  projectId: string;

  name?: string;
  goal?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
};

export interface UpdateSprintService {
  updateSprint(
    input: UpdateSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel>;
}
