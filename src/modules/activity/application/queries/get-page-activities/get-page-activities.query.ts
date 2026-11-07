export class GetPageActivitiesQuery {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly pageId: string,
    public readonly cursor?: string,
    public readonly limit?: string,
  ) {}
}
