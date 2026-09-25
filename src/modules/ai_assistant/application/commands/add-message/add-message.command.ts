import type { AiMessageMetadata } from '../../../domain/entities/ai-message.entity';
import { AiMessageRole } from '../../../domain/enums/ai-message-role.enum';

export class AddMessageCommand {
  constructor(
    public readonly conversationId: string,
    public readonly role: AiMessageRole,
    public readonly content: string,
    public readonly metadata: AiMessageMetadata = null,
  ) {}
}
