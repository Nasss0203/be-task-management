export class ChangeDatabaseRowParentCommand {
  constructor(
    public readonly rowId: string,
    public readonly parentRowId: string | null,
  ) {}
}
