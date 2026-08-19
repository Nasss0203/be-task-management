export class ResendWorkspaceInviteCommand {
  constructor(
    public readonly inviteId: string,
    public readonly resentBy: string,
    public readonly workspaceId: string,
  ) {}
}
