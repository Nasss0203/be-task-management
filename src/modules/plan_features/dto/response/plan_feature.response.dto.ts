export class PlanFeatureResponseDto {
  id: string;
  planId: string;
  featureId: string;
  enabled: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
