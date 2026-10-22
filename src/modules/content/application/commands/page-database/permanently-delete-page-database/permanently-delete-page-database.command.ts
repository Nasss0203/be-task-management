export class PermanentlyDeletePageDatabaseCommand {
  constructor(
    public readonly pageId: string,
    public readonly databaseId: string,
  ) {}
}
