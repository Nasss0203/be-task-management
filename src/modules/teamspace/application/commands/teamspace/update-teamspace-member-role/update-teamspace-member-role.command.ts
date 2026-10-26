import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';

export class UpdateTeamspaceMemberRoleCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly teamspaceMemberId: string,
    public readonly roleName: TeamspaceRole,
    public readonly userId: string,
  ) {}
}
