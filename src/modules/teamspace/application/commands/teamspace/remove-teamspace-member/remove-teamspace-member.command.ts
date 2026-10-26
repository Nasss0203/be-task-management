export class RemoveTeamspaceMemberCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly teamspaceMemberId: string,
    public readonly userId: string,
  ) {}
}
