import { PlanTypeWorkspace } from 'src/modules/workspaces/domain/entities/workspace.entity';

export class WorkspaceOverviewModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly planType: PlanTypeWorkspace,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly memberCount: number,
    public readonly projectCount: number,
    public readonly boardCount: number,
    public readonly taskCount: number,
  ) {}
}
