export class ListPageMentionTitlesQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly pageIds: string[],
  ) {}
}
