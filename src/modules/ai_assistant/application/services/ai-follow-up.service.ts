import { Inject, Injectable } from '@nestjs/common';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import type { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import { AiGenerationStatus } from '../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../domain/repositories/ai-generation.repository';
import { DiscardGenerationCommand } from '../commands/discard-generation/discard-generation.command';
import { DiscardGenerationHandler } from '../commands/discard-generation/discard-generation.handler';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../constants/ai-modification-plan.constant';
import {
  detectFollowUp,
  resolveFollowUp,
  type FollowUpResolution,
  type PreviousTurn,
} from './ai-follow-up';

@Injectable()
export class AiFollowUpService {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generations: AiGenerationRepository,
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly blocks: PageBlockRepository,
    private readonly discardGeneration: DiscardGenerationHandler,
  ) {}

  async resolve(
    instruction: string,
    conversation: AiConversation | null,
  ): Promise<FollowUpResolution | null> {
    const pageId = conversation?.getPageId();
    if (
      !conversation ||
      conversation.getScope() !== AiConversationScope.PAGE ||
      !pageId
    )
      return null;
    const followUp = detectFollowUp(instruction);
    if (!followUp) return null;

    const latest = (
      await this.generations.findByConversationId(conversation.getId())
    )
      .filter(
        (g) =>
          g.getCapability() === AI_MODIFICATION_PLAN_CAPABILITY &&
          g.getStatus() !== AiGenerationStatus.DISCARDED &&
          g.getStatus() !== AiGenerationStatus.FAILED,
      )
      .sort(
        (a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime(),
      )[0];
    const output = (latest?.getOutputData() ?? {}) as Record<string, unknown>;
    const input = (latest?.getInputData() ?? {}) as Record<string, unknown>;
    const status = latest?.getStatus();
    const turn: PreviousTurn | null = latest
      ? {
          generationId: latest.getId(),
          state:
            status === AiGenerationStatus.APPLIED
              ? 'APPLIED'
              : status === AiGenerationStatus.COMPLETED &&
                  output.status === 'PLAN_READY'
                ? 'PENDING'
                : 'OTHER',
          instruction:
            typeof input.instruction === 'string' ? input.instruction : '',
          summary: typeof output.summary === 'string' ? output.summary : '',
          operations: Array.isArray(output.operations)
            ? (output.operations as PreviousTurn['operations'])
            : [],
          appliedAt: latest.getAppliedAt(),
        }
      : null;
    const blocks = (await this.blocks.findByPageId(pageId)).map((block) => {
      const content = block.getContent() as { text?: unknown } | null;
      return {
        id: block.getId(),
        type: block.getType(),
        text: typeof content?.text === 'string' ? content.text : '',
        createdAt: block.getCreatedAt(),
      };
    });
    return resolveFollowUp(followUp, turn, blocks);
  }

  async discard(
    userId: string,
    generationId: string,
    shareToken?: string,
  ): Promise<void> {
    await this.discardGeneration.execute(
      new DiscardGenerationCommand(userId, generationId, shareToken),
    );
  }
}
