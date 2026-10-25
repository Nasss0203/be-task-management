import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiGeneration } from '../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiMessage } from '../../domain/entities/ai-message.entity';
import { AiUsage } from '../../domain/entities/ai-usage.entity';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import { AiConversationStatus } from '../../domain/enums/ai-conversation-status.enum';
import { AiGenerationStatus } from '../../domain/enums/ai-generation-status.enum';
import { AiMessageRole } from '../../domain/enums/ai-message-role.enum';
import type { AiConversationRepository } from '../../domain/repositories/ai-conversation.repository';
import type { AiGenerationRepository } from '../../domain/repositories/ai-generation.repository';
import type { AiMessageRepository } from '../../domain/repositories/ai-message.repository';
import type { AiUsageRepository } from '../../domain/repositories/ai-usage.repository';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../constants/ai-modification-plan.constant';
import type { AiRuntimePort } from '../ports/ai-runtime.port';
import { GetAiPageContextHandler } from '../queries/get-ai-page-context/get-ai-page-context.handler';
import { GetAiPageContextQuery } from '../queries/get-ai-page-context/get-ai-page-context.query';
import type { AiModificationPlan } from '../types/ai-modification-plan';
import { AiConversationAccessService } from './ai-conversation-access.service';
import { isSupportedModification } from './ai-modification-operation.policy';
import { AiModificationPlanValidatorService } from './ai-modification-plan-validator.service';
import {
  fingerprintAiPageContext,
  hasCompleteAiPageContext,
} from './ai-page-context-fingerprint';

export interface GenerateAiModificationPlanParams {
  requestId: string;
  userId: string;
  pageId: string;
  instruction: string;
  // The user's own wording, kept for history when `instruction` is the
  // editing clause extracted from it (Page reference removed).
  originalInstruction?: string;
  conversationId?: string;
  shareToken?: string;
}

export type GenerateAiModificationPlanResult = AiModificationPlan & {
  conversationId: string;
  generationId: string;
};

@Injectable()
export class AiModificationPlannerService {
  constructor(
    private readonly getAiPageContextHandler: GetAiPageContextHandler,

    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,

    @Inject(AI_ASSISTANT_TYPES.repositories.AiMessageRepository)
    private readonly messageRepository: AiMessageRepository,

    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,

    @Inject(AI_ASSISTANT_TYPES.repositories.AiUsageRepository)
    private readonly usageRepository: AiUsageRepository,

    @Inject(AI_ASSISTANT_TYPES.runtime.AiRuntime)
    private readonly runtime: AiRuntimePort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly accessService: AiConversationAccessService,

    private readonly planValidator: AiModificationPlanValidatorService,
  ) {}

  async generate(
    params: GenerateAiModificationPlanParams,
  ): Promise<GenerateAiModificationPlanResult> {
    if (typeof params.instruction !== 'string' || !params.instruction.trim()) {
      throw new BadRequestException(
        'AI modification plan instruction is required',
      );
    }

    if (!isSupportedModification(params.instruction)) {
      throw new UnprocessableEntityException({
        status: 'UNSUPPORTED_OPERATION',
        message: 'Unsupported AI modification operation',
      });
    }

    // The context query enforces PAGE_READ for the current user/share token.
    const pageContext = await this.getAiPageContextHandler.execute(
      new GetAiPageContextQuery(
        params.userId,
        params.pageId,
        params.shareToken,
      ),
    );

    // Confirm requires an untruncated snapshot. Never persist a PLAN_READY
    // draft that cannot possibly pass its later freshness validation.
    if (!hasCompleteAiPageContext(pageContext)) {
      throw new UnprocessableEntityException(
        'The Page context is incomplete. Reduce truncated content or database rows before generating a modification plan.',
      );
    }

    const workspaceId = pageContext.page.workspaceId;
    const historyInstruction = params.originalInstruction?.trim()
      ? params.originalInstruction
      : params.instruction;
    const { conversationId, generationId } =
      await this.unitOfWork.runInTransaction(async (context) => {
        let conversation: AiConversation;
        if (params.conversationId) {
          const existing = await this.conversationRepository.findByIdAndUserId(
            params.conversationId,
            params.userId,
            context,
          );
          if (
            !existing ||
            existing.getScope() !== AiConversationScope.PAGE ||
            existing.getPageId() !== pageContext.page.id ||
            existing.getWorkspaceId() !== workspaceId
          ) {
            throw new NotFoundException('AI page conversation not found');
          }
          await this.accessService.assertCanRead(
            existing,
            params.userId,
            params.shareToken,
            context,
          );
          if (existing.getStatus() !== AiConversationStatus.ACTIVE) {
            throw new BadRequestException('AI conversation is archived');
          }
          conversation = existing;
        } else {
          conversation = await this.conversationRepository.save(
            AiConversation.create({
              userId: params.userId,
              workspaceId,
              scope: AiConversationScope.PAGE,
              pageId: pageContext.page.id,
              title: historyInstruction.trim().slice(0, 255),
            }),
            context,
          );
        }

        const generation = await this.generationRepository.save(
          AiGeneration.create({
            conversationId: conversation.getId(),
            userId: params.userId,
            workspaceId,
            capability: AI_MODIFICATION_PLAN_CAPABILITY,
            inputData: {
              pageId: pageContext.page.id,
              instruction: params.instruction,
              requestId: params.requestId,
              pageContextFingerprint: fingerprintAiPageContext(pageContext),
            },
          }),
          context,
        );

        await this.messageRepository.save(
          AiMessage.create({
            conversationId: conversation.getId(),
            role: AiMessageRole.USER,
            content: historyInstruction,
            metadata: {
              capability: AI_MODIFICATION_PLAN_CAPABILITY,
              generationId: generation.getId(),
              requestId: params.requestId,
            },
          }),
          context,
        );

        return {
          conversationId: conversation.getId(),
          generationId: generation.getId(),
        };
      });

    try {
      const runtimeResult = await this.runtime.execute({
        requestId: params.requestId,
        capability: AI_MODIFICATION_PLAN_CAPABILITY,
        content: params.instruction,
        input: {},
        context: { ...pageContext },
      });
      const validatedPlan = this.planValidator.validate(
        runtimeResult.output,
        pageContext,
      );

      await this.unitOfWork.runInTransaction(async (context) => {
        // A page/conversation may have been deleted while the model was running.
        // Never resurrect history after a cascade delete.
        const conversation =
          await this.conversationRepository.findByIdAndUserId(
            conversationId,
            params.userId,
            context,
          );
        if (!conversation) {
          throw new NotFoundException('AI page conversation not found');
        }
        await this.accessService.assertCanRead(
          conversation,
          params.userId,
          params.shareToken,
          context,
        );

        const generation = await this.generationRepository.findByIdAndUserId(
          generationId,
          params.userId,
          context,
        );
        if (!generation || generation.getConversationId() !== conversationId) {
          throw new NotFoundException('AI generation not found');
        }
        generation.complete({
          outputData: { ...validatedPlan },
          provider: runtimeResult.provider ?? null,
          model: runtimeResult.model ?? null,
        });
        await this.generationRepository.save(generation, context);

        await this.messageRepository.save(
          AiMessage.create({
            conversationId,
            role: AiMessageRole.ASSISTANT,
            content: validatedPlan.summary,
            metadata: {
              capability: AI_MODIFICATION_PLAN_CAPABILITY,
              generationId,
              requestId: params.requestId,
              planStatus: validatedPlan.status,
              ...(runtimeResult.provider
                ? { provider: runtimeResult.provider }
                : {}),
              ...(runtimeResult.model ? { model: runtimeResult.model } : {}),
            },
          }),
          context,
        );

        if (runtimeResult.usage) {
          if (!runtimeResult.provider || !runtimeResult.model) {
            throw new BadGatewayException(
              'AI runtime usage requires provider and model',
            );
          }
          await this.usageRepository.save(
            AiUsage.create({
              userId: params.userId,
              workspaceId,
              conversationId,
              generationId,
              provider: runtimeResult.provider,
              model: runtimeResult.model,
              promptTokens: runtimeResult.usage.promptTokens,
              completionTokens: runtimeResult.usage.completionTokens,
              totalTokens: runtimeResult.usage.totalTokens,
              estimatedCost: runtimeResult.usage.estimatedCost ?? null,
              currency: runtimeResult.usage.currency ?? null,
            }),
            context,
          );
        }
      });

      return { conversationId, generationId, ...validatedPlan };
    } catch (error: unknown) {
      try {
        await this.unitOfWork.runInTransaction(async (context) => {
          const generation = await this.generationRepository.findByIdAndUserId(
            generationId,
            params.userId,
            context,
          );
          if (generation?.getStatus() === AiGenerationStatus.PROCESSING) {
            generation.fail(
              'AI_MODIFICATION_PLAN_ERROR',
              error instanceof Error ? error.message : 'AI planning failed',
            );
            await this.generationRepository.save(generation, context);
          }
        });
      } catch {
        // Preserve the original error; the page may have been deleted.
      }
      throw error;
    }
  }
}
