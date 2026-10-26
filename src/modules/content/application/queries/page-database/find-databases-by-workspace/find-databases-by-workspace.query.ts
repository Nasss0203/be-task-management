export class FindDatabasesByWorkspaceQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    /** true → databases whose blocks are all deleted (the Trash). */
    public readonly trashed: boolean,
  ) {}
}
