import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RevokeAdminSubscriptionDto {
  @IsUUID()
  workspaceId: string;

  @IsOptional()
  @IsString()
  note?: string;
}
