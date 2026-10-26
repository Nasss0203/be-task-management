import { IsUUID } from 'class-validator';

export class InviteTeamspaceMemberDto {
  @IsUUID()
  workspace_member_id: string;
}
