import { IsEnum } from 'class-validator';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';

export class UpdateTeamspaceJoinSettingsDto {
  @IsEnum(TeamspaceVisibility)
  visibility: TeamspaceVisibility;
}
