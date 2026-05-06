import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type CancelSprintServiceInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
};

export interface CancelSprintService {
  cancelSprint(
    input: CancelSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel>;
}
