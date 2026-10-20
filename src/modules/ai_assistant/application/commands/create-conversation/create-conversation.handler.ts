import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { CreateConversationCommand } from './create-conversation.command';

@Injectable()
export class CreateConversationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly accessService: AiConversationAccessService,
  ) {}

  async execute(
    command: CreateConversationCommand,
    context?: PersistenceContext,
  ): Promise<AiConversationResponseDto> {
    if (
      ![AiConversationScope.GLOBAL, AiConversationScope.PAGE].includes(
        command.scope,
      )
    ) {
      throw new BadRequestException(
        'New AI conversations must use GLOBAL or PAGE scope',
      );
    }
    let workspaceId = command.workspaceId;
    if (command.scope === AiConversationScope.PAGE) {
      if (!command.pageId?.trim())
        throw new BadRequestException('PAGE conversations require pageId');
      const page = await this.accessService.getReadablePage(
        command.userId,
        command.pageId,
        command.shareToken,
        context,
      );
      if (workspaceId !== null && workspaceId !== page.getWorkspaceId()) {
        throw new BadRequestException(
          'AI conversation workspace does not match page',
        );
      }
      workspaceId = page.getWorkspaceId();
    } else {
      if (command.pageId !== null)
        throw new BadRequestException(
          'GLOBAL conversations cannot have pageId',
        );
      if (!workspaceId?.trim())
        throw new BadRequestException(
          'GLOBAL conversations require workspaceId',
        );
      await this.accessService.assertWorkspaceRead(command.userId, workspaceId);
    }

    const conversation = AiConversation.create({
      userId: command.userId,
      workspaceId,
      scope: command.scope,
      pageId: command.pageId,
      title: command.title,
    });
    const saved = await this.conversationRepository.save(conversation, context);

    return AiConversationResponseDto.fromDomain(saved);
  }
}
