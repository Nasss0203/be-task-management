export class AiConversationModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly workspaceId: string | null,
    public readonly title: string,
    public readonly lastMessageAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
