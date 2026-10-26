export class InviteTeamspaceMemberCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly workspaceMemberId: string,
    public readonly userId: string,
  ) {}
}
