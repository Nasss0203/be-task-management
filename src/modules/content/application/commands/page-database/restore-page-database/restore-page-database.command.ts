export class RestorePageDatabaseCommand {
  constructor(
    public readonly pageId: string,
    public readonly databaseId: string,
  ) {}
}
