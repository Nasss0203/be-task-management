export class DeletePropertyCommand {
  constructor(
    public readonly databaseId: string,
    public readonly propertyId: string,
  ) {}
}
