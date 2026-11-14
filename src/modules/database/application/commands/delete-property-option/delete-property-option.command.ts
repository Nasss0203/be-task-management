export class DeletePropertyOptionCommand {
  constructor(
    public readonly databaseId: string,
    public readonly propertyId: string,
    public readonly optionId: string,
    public readonly actorId: string | null = null,
  ) {}
}
