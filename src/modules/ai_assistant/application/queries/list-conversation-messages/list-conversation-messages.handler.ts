import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import type { AiMessageRepository } from '../../../domain/repositories/ai-message.repository';
import { AiMessageResponseDto } from '../../dto/response/ai-message.response.dto';
import { ListConversationMessagesQuery } from './list-conversation-messages.query';

@Injectable()
export class ListConversationMessagesHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiMessageRepository)
    private readonly messageRepository: AiMessageRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: ListConversationMessagesQuery,
  ): Promise<AiMessageResponseDto[]> {
    const conversation = await this.conversationRepository.findByIdAndUserId(
      query.conversationId,
      query.userId,
    );

    if (!conversation) {
      throw new NotFoundException('AI conversation not found');
    }

    const workspaceId = conversation.getWorkspaceId();
    if (workspaceId) {
      const allowed = await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: workspaceId },
      });

      if (!allowed) {
        throw new ForbiddenException('Workspace access denied');
      }
    }

    const messages = await this.messageRepository.findByConversationId(
      query.conversationId,
      query.options,
    );
    return messages.map((message) => AiMessageResponseDto.fromDomain(message));
  }
}
