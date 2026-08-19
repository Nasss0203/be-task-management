export class AcceptWorkspaceInviteCommand {
  constructor(
    public readonly token: string,
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
