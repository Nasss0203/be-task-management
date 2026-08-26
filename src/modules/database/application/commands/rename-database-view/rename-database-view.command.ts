export class RenameDatabaseViewCommand {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
    public readonly name: string,
  ) {}
}
