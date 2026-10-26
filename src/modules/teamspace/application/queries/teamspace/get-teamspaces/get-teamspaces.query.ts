export class GetTeamspacesQuery {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
  ) {}
}
