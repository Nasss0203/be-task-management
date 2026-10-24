export class RevokeTeamspaceInvitationCommand {
  constructor(
    public readonly invitationId: string,
    public readonly userId: string,
  ) {}
}
