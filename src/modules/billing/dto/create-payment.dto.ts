import { IsOptional, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  planId: string;

  @IsOptional()
  @IsUUID()
  targetWorkspaceId?: string;
}
