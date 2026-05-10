import { PlanTypeWorkspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { WorkspaceModel } from 'src/modules/workspaces/domain/models/workspaces.model';
import { EntityManager } from 'typeorm';

export interface AdminUpdateWorkspacePlanService {
  updatePlan(
    workspaceId: string,
    planType: PlanTypeWorkspace,
    manager?: EntityManager,
  ): Promise<WorkspaceModel>;
}
