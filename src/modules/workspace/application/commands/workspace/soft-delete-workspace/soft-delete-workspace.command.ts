export class SoftDeleteWorkspaceCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
  ) {}
}
