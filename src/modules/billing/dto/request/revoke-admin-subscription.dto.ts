import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RevokeAdminSubscriptionDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  note?: string;
}
