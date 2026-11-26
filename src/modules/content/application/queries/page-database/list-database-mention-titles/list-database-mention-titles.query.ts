export class ListDatabaseMentionTitlesQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly databaseIds: string[],
  ) {}
}
