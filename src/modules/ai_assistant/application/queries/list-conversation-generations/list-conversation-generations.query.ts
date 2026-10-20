export class ListConversationGenerationsQuery {
  constructor(
    public readonly userId: string,
    public readonly conversationId: string,
    public readonly options: { limit?: number; cursor?: string } = {},
    public readonly shareToken?: string,
  ) {}
}
