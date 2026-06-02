export class PlanFeatureModel {
  constructor(
    public readonly id: string,
    public readonly planId: string,
    public readonly featureId: string,
    public readonly enabled: boolean,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
