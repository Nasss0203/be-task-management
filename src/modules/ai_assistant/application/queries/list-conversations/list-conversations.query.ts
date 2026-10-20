import type { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';

export class ListConversationsQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: {
      workspaceId?: string;
      scope?: AiConversationScope;
      pageId?: string;
      limit?: number;
      cursor?: string;
    } = {},
    public readonly shareToken?: string,
  ) {}
}
