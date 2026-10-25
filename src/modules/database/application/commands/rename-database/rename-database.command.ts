export class RenameDatabaseCommand {
  constructor(
    public readonly databaseId: string,
    public readonly name: string,
  ) {}
}
