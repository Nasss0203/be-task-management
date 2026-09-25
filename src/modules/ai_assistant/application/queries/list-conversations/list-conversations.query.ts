export class ListConversationsQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: {
      workspaceId?: string;
      limit?: number;
      cursor?: string;
    } = {},
  ) {}
}
