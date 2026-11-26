export class DuplicateDatabaseViewCommand {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
  ) {}
}
