import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';

export class CreateConversationCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string | null,
    public readonly title: string | null,
    public readonly scope: AiConversationScope = AiConversationScope.GLOBAL,
    public readonly pageId: string | null = null,
    public readonly shareToken?: string,
  ) {}
}
