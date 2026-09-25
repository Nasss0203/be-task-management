import { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationStatus } from '../../../domain/enums/ai-conversation-status.enum';

export class AiConversationResponseDto {
  id: string;
  workspace_id: string | null;
  title: string | null;
  status: AiConversationStatus;
  created_at: Date;
  updated_at: Date;

  static fromDomain(conversation: AiConversation): AiConversationResponseDto {
    return {
      id: conversation.getId(),
      workspace_id: conversation.getWorkspaceId(),
      title: conversation.getTitle(),
      status: conversation.getStatus(),
      created_at: conversation.getCreatedAt(),
      updated_at: conversation.getUpdatedAt(),
    };
  }
}
