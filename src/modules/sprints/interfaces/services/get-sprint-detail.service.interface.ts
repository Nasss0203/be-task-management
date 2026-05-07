import { EntityManager } from 'typeorm';
import { SprintsModel } from '../../domain/models/sprints.model';

export type GetSprintDetailServiceInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
};

export interface GetSprintDetailService {
  getSprintDetail(
    input: GetSprintDetailServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel>;
}
