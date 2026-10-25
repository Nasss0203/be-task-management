export class RestoreTeamspaceCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly userId: string,
  ) {}
}
