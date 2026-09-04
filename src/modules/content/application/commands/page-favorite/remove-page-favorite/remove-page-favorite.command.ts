export class RemovePageFavoriteCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
  ) {}
}
