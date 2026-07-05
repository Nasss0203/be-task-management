import { AiMessageRole } from '../enums/ai-message-role.enum';

export class AiMessageModel {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly role: AiMessageRole,
    public readonly content: string,
    public readonly context: Record<string, unknown> | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}
}
