import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';

@Injectable()
export class AiConversationAccessService {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async assertWorkspaceRead(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const allowed = await this.authorizationService.authorize({
      userId,
      permissions: [PERMISSIONS.WORKSPACE_READ],
      target: { type: 'workspace', id: workspaceId },
    });
    if (!allowed) throw new ForbiddenException('Workspace access denied');
  }

  async getReadablePage(
    userId: string,
    pageId: string,
    shareToken?: string,
    context?: PersistenceContext,
  ): Promise<Page> {
    const page = await this.pageRepository.findById(pageId, context);
    if (!page || page.getDeletedAt() !== null)
      throw new NotFoundException('Page not found');
    const allowed = await this.authorizationService.authorize({
      userId,
      permissions: [PERMISSIONS.PAGE_READ],
      target: { type: 'page', id: page.getId() },
      shareToken,
    });
    if (!allowed) throw new ForbiddenException('Page access denied');
    return page;
  }

  async assertCanRead(
    conversation: AiConversation,
    userId: string,
    shareToken?: string,
    context?: PersistenceContext,
  ): Promise<void> {
    if (conversation.getUserId() !== userId)
      throw new NotFoundException('AI conversation not found');
    if (conversation.getScope() === AiConversationScope.PAGE) {
      const pageId = conversation.getPageId();
      if (!pageId)
        throw new ForbiddenException(
          'AI conversation is missing its page scope',
        );
      const page = await this.getReadablePage(
        userId,
        pageId,
        shareToken,
        context,
      );
      if (page.getWorkspaceId() !== conversation.getWorkspaceId()) {
        throw new ForbiddenException(
          'AI conversation workspace does not match page',
        );
      }
      return;
    }
    const workspaceId = conversation.getWorkspaceId();
    if (workspaceId) {
      await this.assertWorkspaceRead(userId, workspaceId);
    } else if (conversation.getScope() !== AiConversationScope.LEGACY) {
      throw new ForbiddenException(
        'AI conversation workspace is no longer available',
      );
    }
  }

  async canRead(
    conversation: AiConversation,
    userId: string,
    shareToken?: string,
  ): Promise<boolean> {
    try {
      await this.assertCanRead(conversation, userId, shareToken);
      return true;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      )
        return false;
      throw error;
    }
  }
}
