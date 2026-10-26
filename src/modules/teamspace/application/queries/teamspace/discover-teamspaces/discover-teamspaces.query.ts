export class DiscoverTeamspacesQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
