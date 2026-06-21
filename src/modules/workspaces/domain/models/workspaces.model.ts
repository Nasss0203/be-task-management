import {
  PlanTypeWorkspace,
  WorkspaceLayoutMode,
} from '../entities/workspace.entity';

export class WorkspaceModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly planType: PlanTypeWorkspace,
    public readonly layoutMode: WorkspaceLayoutMode,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
    public readonly deletedBy: string | null,
    public readonly createdBy: string | null,
  ) {}
}
