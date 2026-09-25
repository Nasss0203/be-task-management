import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';
import { CreateConversationCommand } from './create-conversation.command';

@Injectable()
export class CreateConversationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: CreateConversationCommand,
    context?: PersistenceContext,
  ): Promise<AiConversationResponseDto> {
    if (command.workspaceId) {
      const allowed = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: command.workspaceId },
      });

      if (!allowed) {
        throw new ForbiddenException('Workspace access denied');
      }
    }

    const conversation = AiConversation.create({
      userId: command.userId,
      workspaceId: command.workspaceId,
      title: command.title,
    });
    const saved = await this.conversationRepository.save(conversation, context);

    return AiConversationResponseDto.fromDomain(saved);
  }
}
