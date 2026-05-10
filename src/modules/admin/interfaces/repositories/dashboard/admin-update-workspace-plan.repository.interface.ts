import { PlanTypeWorkspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { WorkspaceModel } from 'src/modules/workspaces/domain/models/workspaces.model';
import { EntityManager } from 'typeorm';

export interface AdminUpdateWorkspacePlanRepository {
  updatePlan(
    workspaceId: string,
    planType: PlanTypeWorkspace,
    manager?: EntityManager,
  ): Promise<WorkspaceModel>;
}
