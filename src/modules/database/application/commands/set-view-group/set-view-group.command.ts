export class SetViewGroupCommand {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
    public readonly propertyId: string | null,
  ) {}
}
