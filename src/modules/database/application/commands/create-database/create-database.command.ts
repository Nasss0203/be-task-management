export class CreateDatabaseCommand {
  constructor(
    public readonly pageId: string,
    public readonly name: string,
    public readonly titleOnly = false,
    public readonly actorId: string | null = null,
  ) {}
}
