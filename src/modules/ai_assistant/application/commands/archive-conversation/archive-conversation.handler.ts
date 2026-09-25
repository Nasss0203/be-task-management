import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';
import { ArchiveConversationCommand } from './archive-conversation.command';

@Injectable()
export class ArchiveConversationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: ArchiveConversationCommand,
    context?: PersistenceContext,
  ): Promise<AiConversationResponseDto> {
    const conversation = await this.conversationRepository.findByIdAndUserId(
      command.conversationId,
      command.userId,
      context,
    );

    if (!conversation) {
      throw new NotFoundException('AI conversation not found');
    }

    const workspaceId = conversation.getWorkspaceId();
    if (workspaceId) {
      const allowed = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: workspaceId },
      });

      if (!allowed) {
        throw new ForbiddenException('Workspace access denied');
      }
    }

    conversation.archive();
    const saved = await this.conversationRepository.save(conversation, context);
    return AiConversationResponseDto.fromDomain(saved);
  }
}
