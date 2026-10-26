export class SearchPagesQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly query: string,
  ) {}
}
