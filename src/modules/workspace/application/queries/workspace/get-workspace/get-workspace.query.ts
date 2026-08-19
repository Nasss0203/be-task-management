export class GetWorkspaceQuery {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
  ) {}
}
