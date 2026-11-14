export class GetPrivateTeamspaceSummariesQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
  ) {}
}
