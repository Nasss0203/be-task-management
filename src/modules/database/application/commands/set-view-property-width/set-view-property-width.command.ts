export class SetViewPropertyWidthCommand {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
    public readonly propertyId: string,
    public readonly width: number | null,
  ) {}
}
