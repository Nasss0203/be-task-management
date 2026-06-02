import { IsBoolean, IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateWorkspaceFeatureSettingDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  featureId: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsUUID()
  createdBy?: string | null;

  @IsOptional()
  @IsUUID()
  updatedBy?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
