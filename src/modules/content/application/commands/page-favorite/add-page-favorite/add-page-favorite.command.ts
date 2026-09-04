export class AddPageFavoriteCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
  ) {}
}
