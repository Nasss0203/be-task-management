import { IsBoolean, IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreatePlanFeatureDto {
  @IsUUID()
  planId: string;

  @IsUUID()
  featureId: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
