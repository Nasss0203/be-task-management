import { TeamspaceInvitationStatus } from 'src/modules/teamspace/domain/enums/teamspace-invitation-status.enum';

export class ListTeamspaceInvitationsQuery {
  constructor(
    public readonly teamspaceId: string,
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly status?: TeamspaceInvitationStatus,
  ) {}
}
