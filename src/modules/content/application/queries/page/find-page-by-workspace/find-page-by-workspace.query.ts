export class FindPageByWorkspaceQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
  ) {}
}
