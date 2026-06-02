export class WorkspaceFeatureSettingModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly featureId: string,
    public readonly enabled: boolean,
    public readonly createdBy: string | null,
    public readonly updatedBy: string | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
