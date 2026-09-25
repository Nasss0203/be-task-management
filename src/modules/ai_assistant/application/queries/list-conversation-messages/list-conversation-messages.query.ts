export class ListConversationMessagesQuery {
  constructor(
    public readonly userId: string,
    public readonly conversationId: string,
    public readonly options: { limit?: number; cursor?: string } = {},
  ) {}
}
