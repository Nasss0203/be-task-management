import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateTeamspaceInviteLinkDto {
  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  max_uses?: number;
}
