import { UsageResourceType } from '../../domain/entities/usage-limit.entity';

export class UsageLimitResponseDto {
  id: string;
  workspaceId: string;
  planId: string | null;
  resourceType: UsageResourceType;
  limitValue: number | null;
  usedValue: number;
  resetAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;

  workspaceName: string | null;
  workspaceSlug: string | null;
  planName: string | null;
  planSlug: string | null;
}
