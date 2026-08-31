import { TeamspaceRole } from '../../../../domain/enums/teamspace-role.enum';

export class AddTeamspaceMemberCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly workspaceMemberId: string,
    public readonly role: TeamspaceRole,
    // User đang thực hiện thao tác add member
    public readonly userId: string,
  ) {}
}
