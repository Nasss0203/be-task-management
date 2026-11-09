export class GetWorkspaceStorageQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly actorId: string,
  ) {}
}
