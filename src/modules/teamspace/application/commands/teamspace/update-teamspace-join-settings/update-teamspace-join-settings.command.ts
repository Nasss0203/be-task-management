import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';

export class UpdateTeamspaceJoinSettingsCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly visibility: TeamspaceVisibility,
    public readonly userId: string,
  ) {}
}
