import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';
import { ListConversationsQuery } from './list-conversations.query';

@Injectable()
export class ListConversationsHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: ListConversationsQuery,
  ): Promise<AiConversationResponseDto[]> {
    if (query.filters.workspaceId) {
      const allowed = await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: query.filters.workspaceId },
      });

      if (!allowed) {
        throw new ForbiddenException('Workspace access denied');
      }
    }

    const conversations = await this.conversationRepository.findByUserId(
      query.userId,
      query.filters,
    );
    return conversations.map((conversation) =>
      AiConversationResponseDto.fromDomain(conversation),
    );
  }
}
