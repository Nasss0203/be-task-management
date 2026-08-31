import { IsEnum, IsUUID } from 'class-validator';
import { TeamspaceRole } from 'src/modules/workspace/domain/enums/teamspace-role.enum';

export class AddTeamspaceMemberDto {
  @IsUUID()
  workspace_member_id: string;

  @IsEnum(TeamspaceRole)
  role_name: TeamspaceRole;
}
