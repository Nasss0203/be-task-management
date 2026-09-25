import { randomUUID } from 'crypto';
import { AiMessageRole } from '../enums/ai-message-role.enum';

export type AiMessageMetadata = Record<string, unknown> | null;

interface CreateAiMessageParams {
  id?: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  metadata?: AiMessageMetadata;
  createdAt?: Date;
}

interface RestoreAiMessageParams {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  metadata: AiMessageMetadata;
  createdAt: Date;
}

export class AiMessage {
  private constructor(
    private readonly id: string,
    private readonly conversationId: string,
    private readonly role: AiMessageRole,
    private readonly content: string,
    private readonly metadata: AiMessageMetadata,
    private readonly createdAt: Date,
  ) {
    if (!conversationId.trim()) {
      throw new Error('AI message conversation id is required');
    }

    if (!content.trim()) {
      throw new Error('AI message content is required');
    }
  }

  static create(params: CreateAiMessageParams): AiMessage {
    return new AiMessage(
      params.id ?? randomUUID(),
      params.conversationId,
      params.role,
      params.content,
      params.metadata ?? null,
      params.createdAt ?? new Date(),
    );
  }

  static restore(params: RestoreAiMessageParams): AiMessage {
    return new AiMessage(
      params.id,
      params.conversationId,
      params.role,
      params.content,
      params.metadata,
      params.createdAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getConversationId(): string {
    return this.conversationId;
  }

  getRole(): AiMessageRole {
    return this.role;
  }

  getContent(): string {
    return this.content;
  }

  getMetadata(): AiMessageMetadata {
    return this.metadata;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
