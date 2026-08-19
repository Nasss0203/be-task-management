export class DeleteWorkspaceMemberCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly actorId: string,
  ) {}
}
