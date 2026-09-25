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
import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';
import { GetConversationQuery } from './get-conversation.query';

@Injectable()
export class GetConversationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: GetConversationQuery,
  ): Promise<AiConversationResponseDto> {
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

    return AiConversationResponseDto.fromDomain(conversation);
  }
}
