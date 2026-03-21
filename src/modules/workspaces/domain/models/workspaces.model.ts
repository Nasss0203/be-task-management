import { PlanTypeWorkspace } from '../entities/workspace.entity';

export class WorkspaceModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly planType: PlanTypeWorkspace,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
