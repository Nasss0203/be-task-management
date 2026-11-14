export class AddPropertyOptionCommand {
  constructor(
    public readonly databaseId: string,
    public readonly propertyId: string,
    public readonly name: string,
    public readonly color: string | null,
    public readonly actorId: string | null = null,
  ) {}
}
