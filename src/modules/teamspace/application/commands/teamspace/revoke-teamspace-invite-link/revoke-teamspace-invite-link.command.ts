export class RevokeTeamspaceInviteLinkCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly linkId: string,
    public readonly userId: string,
  ) {}
}
