export class DuplicatePageCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly pageId: string,
  ) {}
}
