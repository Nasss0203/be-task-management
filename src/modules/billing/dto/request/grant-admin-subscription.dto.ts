import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class GrantAdminSubscriptionDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  planId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  months?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
