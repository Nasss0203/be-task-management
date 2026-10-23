export class ListTeamspaceInviteLinksQuery {
  constructor(
    public readonly teamspaceId: string,
    public readonly userId: string,
  ) {}
}
