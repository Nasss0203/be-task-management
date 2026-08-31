export class GetTeamspaceMembersQuery {
  constructor(
    public readonly teamspaceId: string,
    public readonly userId: string,
  ) {}
}
