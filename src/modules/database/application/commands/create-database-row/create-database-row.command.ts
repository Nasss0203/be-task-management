export class CreateDatabaseRowCommand {
  constructor(
    public readonly databaseId: string,
    public readonly parentRowId: string | null = null,
    public readonly actorId: string | null = null,
  ) {}
}
