export class FindDeletedPageBlocksQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly pageId?: string,
  ) {}
}
