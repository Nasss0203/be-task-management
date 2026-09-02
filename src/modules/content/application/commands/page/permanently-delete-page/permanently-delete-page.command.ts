export class PermanentlyDeletePageCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly pageId: string,
  ) {}
}
