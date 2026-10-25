export class GetArchivedTeamspacesQuery {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
  ) {}
}
