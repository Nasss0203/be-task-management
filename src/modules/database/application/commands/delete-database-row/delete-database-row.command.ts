export class DeleteDatabaseRowCommand {
  constructor(
    public readonly rowId: string,
    public readonly actorId: string | null = null,
  ) {}
}
