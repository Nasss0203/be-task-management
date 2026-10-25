import type { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { InvalidAiGenerationTransitionException } from '../../../domain/exceptions/invalid-ai-generation-transition.exception';
import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';
import { DiscardGenerationCommand } from './discard-generation.command';

@Injectable()
export class DiscardGenerationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly conversationAccess: AiConversationAccessService,
  ) {}

  private async assertCanDiscard(
    generation: AiGeneration,
    command: DiscardGenerationCommand,
    context: PersistenceContext,
  ): Promise<void> {
    const conversationId = generation.getConversationId();
    let conversationPageId: string | null = null;
    if (conversationId !== null) {
      const conversation = await this.conversationRepository.findByIdAndUserId(
        conversationId,
        command.userId,
        context,
      );
      if (!conversation || conversation.getUserId() !== command.userId) {
        throw new NotFoundException('AI conversation not found');
      }
      if (generation.getWorkspaceId() !== conversation.getWorkspaceId()) {
        throw new ForbiddenException(
          'AI generation workspace does not match conversation',
        );
      }
      await this.conversationAccess.assertCanRead(
        conversation,
        command.userId,
        command.shareToken,
        context,
      );
      if (conversation.getScope() === AiConversationScope.PAGE) {
        conversationPageId = conversation.getPageId();
      }
    } else if (generation.getWorkspaceId()) {
      await this.conversationAccess.assertWorkspaceRead(
        command.userId,
        generation.getWorkspaceId()!,
      );
    }

    if (generation.getCapability() !== AI_MODIFICATION_PLAN_CAPABILITY) return;
    const input = generation.getInputData();
    if (
      input === null ||
      typeof input !== 'object' ||
      Array.isArray(input) ||
      typeof input.pageId !== 'string' ||
      !input.pageId.trim()
    ) {
      throw new ForbiddenException(
        'AI modification plan is missing its page target',
      );
    }
    if (conversationPageId !== null) {
      if (input.pageId !== conversationPageId) {
        throw new ForbiddenException(
          'AI modification plan target does not match conversation',
        );
      }
      // assertCanRead already authorized this exact Page in this transaction.
      return;
    }
    const page = await this.conversationAccess.getReadablePage(
      command.userId,
      input.pageId,
      command.shareToken,
      context,
    );
    if (page.getWorkspaceId() !== generation.getWorkspaceId()) {
      throw new ForbiddenException(
        'AI generation workspace does not match target page',
      );
    }
    // Discard requires access, not a fresh fingerprint or executable plan.
  }

  async execute(
    command: DiscardGenerationCommand,
    context?: PersistenceContext,
  ): Promise<AiGenerationResponseDto> {
    const discard = async (transaction: PersistenceContext) => {
      // Same row lock as Confirm. A losing request sees APPLIED/DISCARDED
      // after the winning transaction commits and cannot change the status.
      const generation =
        await this.generationRepository.findByIdAndUserIdForUpdate(
          command.generationId,
          command.userId,
          transaction,
        );

      if (!generation || generation.getUserId() !== command.userId) {
        throw new NotFoundException('AI generation not found');
      }

      await this.assertCanDiscard(generation, command, transaction);

      try {
        generation.discard();
      } catch (error) {
        if (error instanceof InvalidAiGenerationTransitionException) {
          throw new ConflictException(
            'This AI draft has already been applied or discarded.',
          );
        }
        throw error;
      }
      const saved = await this.generationRepository.save(
        generation,
        transaction,
      );
      return AiGenerationResponseDto.fromDomain(saved);
    };

    return context !== undefined
      ? discard(context)
      : this.unitOfWork.runInTransaction(discard);
  }
}
