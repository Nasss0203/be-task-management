export class DeclineTeamspaceInvitationCommand {
  constructor(
    public readonly invitationId: string,
    public readonly userId: string,
  ) {}
}
