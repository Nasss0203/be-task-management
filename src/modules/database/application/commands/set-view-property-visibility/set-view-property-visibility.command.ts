export class SetViewPropertyVisibilityCommand {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
    public readonly propertyId: string,
    public readonly visible: boolean,
  ) {}
}
