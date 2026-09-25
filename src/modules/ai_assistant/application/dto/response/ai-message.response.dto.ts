import { AiMessage } from '../../../domain/entities/ai-message.entity';
import { AiMessageRole } from '../../../domain/enums/ai-message-role.enum';

const SENSITIVE_KEY_PATTERN =
  /token|secret|password|authorization|api[-_]?key|credential/i;

function sanitizeMetadata(
  value: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) => !key.startsWith('_') && !SENSITIVE_KEY_PATTERN.test(key),
      )
      .map(([key, item]) => [
        key,
        item && typeof item === 'object' && !Array.isArray(item)
          ? sanitizeMetadata(item as Record<string, unknown>)
          : item,
      ]),
  );
}

export class AiMessageResponseDto {
  id: string;
  conversation_id: string;
  role: AiMessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;

  static fromDomain(message: AiMessage): AiMessageResponseDto {
    return {
      id: message.getId(),
      conversation_id: message.getConversationId(),
      role: message.getRole(),
      content: message.getContent(),
      metadata: sanitizeMetadata(message.getMetadata()),
      created_at: message.getCreatedAt(),
    };
  }
}
