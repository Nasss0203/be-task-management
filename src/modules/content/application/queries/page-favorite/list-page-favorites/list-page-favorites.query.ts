export class ListPageFavoritesQuery {
  constructor(
    public readonly userId: string,
    public readonly workspaceId?: string,
  ) {}
}
