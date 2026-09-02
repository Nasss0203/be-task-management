export class RestorePageCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly pageId: string,
    public readonly userId: string,
  ) {}
}
