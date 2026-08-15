export class CreateDatabaseCommand {
  constructor(
    public readonly pageId: string,
    public readonly name: string,
  ) {}
}
