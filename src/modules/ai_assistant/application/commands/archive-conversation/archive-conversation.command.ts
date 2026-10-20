export class ArchiveConversationCommand {
  constructor(
    public readonly userId: string,
    public readonly conversationId: string,
    public readonly shareToken?: string,
  ) {}
}
