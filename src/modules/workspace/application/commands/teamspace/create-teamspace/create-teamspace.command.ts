import { TeamspaceVisibility } from 'src/modules/workspace/domain/enums/teamspace-visibility.enum';

export class CreateTeamspaceCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly description?: string | null,
    public readonly icon?: string | null,
    public readonly visibility?: TeamspaceVisibility,
  ) {}
}
