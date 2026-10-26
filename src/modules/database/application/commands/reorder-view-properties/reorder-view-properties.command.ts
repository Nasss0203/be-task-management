export class ReorderViewPropertiesCommand {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
    public readonly propertyIds: string[],
  ) {}
}
