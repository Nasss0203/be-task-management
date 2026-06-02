export class FeatureModel {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly category: string | null,
    public readonly isActive: boolean,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
