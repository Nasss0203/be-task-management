export class RevokeWorkspaceInviteCommand {
  constructor(
    public readonly inviteId: string,
    public readonly revokedBy: string,
    public readonly workspaceId: string,
  ) {}
}
