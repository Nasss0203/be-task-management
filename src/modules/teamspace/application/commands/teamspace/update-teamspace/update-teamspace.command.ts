export class UpdateTeamspaceCommand {
  constructor(
    public readonly teamspaceId: string,
    public readonly userId: string,
    public readonly name?: string | null,
    public readonly description?: string | null,
    public readonly icon?: string | null,
  ) {}
}
