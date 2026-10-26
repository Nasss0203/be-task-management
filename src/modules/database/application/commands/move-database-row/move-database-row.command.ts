export class MoveDatabaseRowCommand {
  constructor(
    public readonly rowId: string,
    public readonly previousRowId: string | null,
    public readonly nextRowId: string | null,
  ) {}
}
