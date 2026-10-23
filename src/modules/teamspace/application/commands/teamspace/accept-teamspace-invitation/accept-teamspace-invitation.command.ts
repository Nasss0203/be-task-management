export class AcceptTeamspaceInvitationCommand {
  constructor(
    public readonly invitationId: string,
    public readonly userId: string,
  ) {}
}
