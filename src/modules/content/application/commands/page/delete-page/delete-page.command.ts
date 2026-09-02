export class DeletePageCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly pageId: string,
    public readonly userId: string,
  ) {}
}
