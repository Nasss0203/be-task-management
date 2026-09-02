export class MovePageCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly pageId: string,
    public readonly parentPageId: string | null,
    public readonly teamspaceId: string | null,
  ) {}
}
