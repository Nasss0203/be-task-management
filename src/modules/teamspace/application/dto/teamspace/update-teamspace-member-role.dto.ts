import { IsEnum } from 'class-validator';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';

export class UpdateTeamspaceMemberRoleDto {
  @IsEnum(TeamspaceRole)
  role_name: TeamspaceRole;
}
