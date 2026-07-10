export class AiConversationResponseDto {
  id: string;
  userId: string;
  workspaceId: string | null;
  title: string;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
