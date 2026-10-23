export class JoinTeamspaceCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly userId: string,
  ) {}
}
