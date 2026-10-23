export class CreateTeamspaceInviteLinkCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly userId: string,
    public readonly expiresAt?: string,
    public readonly maxUses?: number,
  ) {}
}
