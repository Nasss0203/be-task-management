export class RestoreWorkspaceCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
  ) {}
}
