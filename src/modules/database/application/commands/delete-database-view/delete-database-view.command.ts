export class DeleteDatabaseViewCommand {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
  ) {}
}
