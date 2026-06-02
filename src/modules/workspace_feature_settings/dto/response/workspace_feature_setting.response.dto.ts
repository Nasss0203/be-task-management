export class WorkspaceFeatureSettingResponseDto {
  id: string;
  workspaceId: string;
  featureId: string;
  enabled: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
