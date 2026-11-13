export class LeaveTeamspaceCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly userId: string,
    public readonly newOwnerMemberId?: string,
  ) {}
}
