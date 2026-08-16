export class UpdatePropertyOptionCommand {
  constructor(
    public readonly databaseId: string,
    public readonly propertyId: string,
    public readonly optionId: string,
    public readonly name: string,
    public readonly color: string | null,
  ) {}
}
