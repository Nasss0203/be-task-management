export class ResendTeamspaceInvitationCommand {
  constructor(
    public readonly invitationId: string,
    public readonly userId: string,
  ) {}
}
