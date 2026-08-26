export class SelectWorkspaceCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
  ) {}
}
