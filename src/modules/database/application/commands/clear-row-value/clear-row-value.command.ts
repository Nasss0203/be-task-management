export class ClearRowValueCommand {
  constructor(
    public readonly rowId: string,
    public readonly propertyId: string,
  ) {}
}
