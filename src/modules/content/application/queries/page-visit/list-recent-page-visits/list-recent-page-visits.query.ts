export class ListRecentPageVisitsQuery {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly limit?: string,
  ) {}
}
