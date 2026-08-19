export class DeclineWorkspaceInviteCommand {
  constructor(
    public readonly token: string,
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
