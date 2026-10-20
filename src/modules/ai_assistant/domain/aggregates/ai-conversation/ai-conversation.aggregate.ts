import { randomUUID } from 'crypto';
import { AiConversationScope } from '../../enums/ai-conversation-scope.enum';
import { AiConversationStatus } from '../../enums/ai-conversation-status.enum';

interface CreateAiConversationParams {
  id?: string;
  userId: string;
  workspaceId?: string | null;
  scope?: AiConversationScope;
  pageId?: string | null;
  title?: string | null;
  status?: AiConversationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RestoreAiConversationParams {
  id: string;
  userId: string;
  workspaceId: string | null;
  scope?: AiConversationScope;
  pageId?: string | null;
  title: string | null;
  status: AiConversationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class AiConversation {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly workspaceId: string | null,
    private readonly scope: AiConversationScope,
    private readonly pageId: string | null,
    private title: string | null,
    private status: AiConversationStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    if (!userId.trim()) {
      throw new Error('AI conversation user id is required');
    }

    if (!Object.values(AiConversationScope).includes(scope)) {
      throw new Error('Invalid AI conversation scope');
    }

    if (
      scope === AiConversationScope.PAGE ? !pageId?.trim() : pageId !== null
    ) {
      throw new Error('Only PAGE conversations must have a page id');
    }

    if (title !== null && title.length > 255) {
      throw new Error('AI conversation title must not exceed 255 characters');
    }
  }

  static create(params: CreateAiConversationParams): AiConversation {
    const scope = params.scope ?? AiConversationScope.GLOBAL;
    if (scope === AiConversationScope.LEGACY) {
      throw new Error('LEGACY conversations can only be restored');
    }
    if (!params.workspaceId?.trim()) {
      throw new Error('New AI conversations require a workspace id');
    }
    const now = new Date();

    return new AiConversation(
      params.id ?? randomUUID(),
      params.userId,
      params.workspaceId ?? null,
      scope,
      params.pageId ?? null,
      params.title ?? null,
      params.status ?? AiConversationStatus.ACTIVE,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static restore(params: RestoreAiConversationParams): AiConversation {
    return new AiConversation(
      params.id,
      params.userId,
      params.workspaceId,
      params.scope ?? AiConversationScope.LEGACY,
      params.pageId ?? null,
      params.title,
      params.status,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getWorkspaceId(): string | null {
    return this.workspaceId;
  }

  getTitle(): string | null {
    return this.title;
  }

  getScope(): AiConversationScope {
    return this.scope;
  }

  getPageId(): string | null {
    return this.pageId;
  }

  getStatus(): AiConversationStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rename(title: string | null): void {
    if (title !== null && title.length > 255) {
      throw new Error('AI conversation title must not exceed 255 characters');
    }

    this.title = title;
    this.updatedAt = new Date();
  }

  archive(): void {
    if (this.status === AiConversationStatus.ARCHIVED) {
      return;
    }

    this.status = AiConversationStatus.ARCHIVED;
    this.updatedAt = new Date();
  }
}
