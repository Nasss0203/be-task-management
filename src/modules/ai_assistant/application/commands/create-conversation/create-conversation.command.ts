export class CreateConversationCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string | null,
    public readonly title: string | null,
  ) {}
}
