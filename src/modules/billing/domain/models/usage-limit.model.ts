import { UsageResourceType } from '../entities/usage-limit.entity';

export class UsageLimitModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly planId: string | null,
    public readonly resourceType: UsageResourceType,
    public readonly limitValue: number | null,
    public readonly usedValue: number,
    public readonly resetAt: Date | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly workspaceName: string | null = null,
    public readonly workspaceSlug: string | null = null,
    public readonly planName: string | null = null,
    public readonly planSlug: string | null = null,
  ) {}
}
