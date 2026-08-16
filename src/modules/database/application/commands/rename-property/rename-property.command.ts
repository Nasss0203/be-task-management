export class RenamePropertyCommand {
  constructor(
    public readonly databaseId: string,
    public readonly propertyId: string,
    public readonly name: string,
  ) {}
}
