import { AiMessageRole } from '../../domain/enums/ai-message-role.enum';

export class AiMessageResponseDto {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  context: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  generation?: any;
}
