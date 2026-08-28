export class GetDatabaseViewQuery {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
  ) {}
}
