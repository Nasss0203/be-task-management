export class ClearRowValueCommand {
  constructor(
    public readonly rowId: string,
    public readonly propertyId: string,
    public readonly actorId: string | null = null,
  ) {}
}
