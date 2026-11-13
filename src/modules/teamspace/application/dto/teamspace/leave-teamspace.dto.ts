import { IsOptional, IsUUID } from 'class-validator';

export class LeaveTeamspaceDto {
  @IsOptional()
  @IsUUID()
  newOwnerMemberId?: string;
}
