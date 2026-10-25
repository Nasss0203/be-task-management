import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import { AiGeneration } from '../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiMessage } from '../../domain/entities/ai-message.entity';
import { AiUsage } from '../../domain/entities/ai-usage.entity';
import { AiGenerationStatus } from '../../domain/enums/ai-generation-status.enum';
import { AiMessageRole } from '../../domain/enums/ai-message-role.enum';
import type { AiConversationRepository } from '../../domain/repositories/ai-conversation.repository';
import type { AiGenerationRepository } from '../../domain/repositories/ai-generation.repository';
import type { AiMessageRepository } from '../../domain/repositories/ai-message.repository';
import type { AiUsageRepository } from '../../domain/repositories/ai-usage.repository';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../constants/page-composition.constant';
import { AiGenerationResponseDto } from '../dto/response/ai-generation.response.dto';
import type { AiRuntimePort } from '../ports/ai-runtime.port';
import { PageCompositionDraftValidator } from './page-composition-draft-validator.service';
import { AiConversationAccessService } from './ai-conversation-access.service';
import { AiSubmitAuthorizationLock } from './ai-submit-authorization-lock.port';

export interface SubmitAiRequestParams {
  requestId: string;
  userId: string;
  conversationId: string;
  capability: string;
  content: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  shareToken?: string;
}

@Injectable()
export class AiAssistantService {
  constructor(
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
    private readonly pageCompositionDraftValidator: PageCompositionDraftValidator,
    private readonly authorizationLock: AiSubmitAuthorizationLock,
  ) {}

  async submit(
    params: SubmitAiRequestParams,
  ): Promise<AiGenerationResponseDto> {
    if (params.capability === AI_MODIFICATION_PLAN_CAPABILITY) {
      throw new BadRequestException(
        'Page modification planning must use the dedicated page endpoint',
      );
    }

    const conversation = await this.conversationRepository.findByIdAndUserId(
      params.conversationId,
      params.userId,
    );

    if (!conversation) {
      throw new NotFoundException('AI conversation not found');
    }

    const workspaceId = conversation.getWorkspaceId();

    await this.accessService.assertCanRead(
      conversation,
      params.userId,
      params.shareToken,
    );

    const generationId = await this.unitOfWork.runInTransaction(
      async (context) => {
        const currentConversation =
          await this.conversationRepository.findByIdAndUserId(
            params.conversationId,
            params.userId,
            context,
          );

        if (!currentConversation) {
          throw new NotFoundException('AI conversation not found');
        }

        await this.messageRepository.save(
          AiMessage.create({
            conversationId: params.conversationId,
            role: AiMessageRole.USER,
            content: params.content,
            metadata: {
              ...(params.metadata ?? {}),
              requestId: params.requestId,
            },
          }),
          context,
        );

        const generation = await this.generationRepository.save(
          AiGeneration.create({
            conversationId: params.conversationId,
            userId: params.userId,
            workspaceId,
            capability: params.capability,
            inputData: params.input,
          }),
          context,
        );

        return generation.getId();
      },
    );

    let failureCode = 'AI_RUNTIME_ERROR';
    try {
      const result = await this.runtime.execute({
        requestId: params.requestId,
        capability: params.capability,
        content: params.content,
        input: params.input,
        context: params.context,
      });

      failureCode = 'AI_COMPLETION_ERROR';
      return await this.unitOfWork.runInTransaction(async (context) => {
        const generation =
          await this.generationRepository.findByIdAndUserIdForUpdate(
            generationId,
            params.userId,
            context,
          );

        if (!generation || generation.getUserId() !== params.userId) {
          throw new NotFoundException('AI generation not found');
        }

        if (generation.getStatus() !== AiGenerationStatus.PROCESSING) {
          throw new ConflictException('AI generation is no longer processing');
        }
        failureCode = 'AI_ACCESS_REVOKED';
        const currentConversation =
          await this.conversationRepository.findByIdAndUserId(
            params.conversationId,
            params.userId,
            context,
          );
        if (
          !currentConversation ||
          currentConversation.getUserId() !== params.userId
        ) {
          throw new NotFoundException('AI conversation not found');
        }
        await this.authorizationLock.lock(
          currentConversation,
          context,
          params.userId,
        );
        // Read again after locking: a concurrent scope update may have won first.
        const freshConversation =
          await this.conversationRepository.findByIdAndUserId(
            params.conversationId,
            params.userId,
            context,
          );
        if (
          !freshConversation ||
          freshConversation.getUserId() !== params.userId
        ) {
          throw new NotFoundException('AI conversation not found');
        }
        if (
          generation.getConversationId() !== params.conversationId ||
          freshConversation.getId() !== params.conversationId ||
          generation.getWorkspaceId() !== freshConversation.getWorkspaceId() ||
          freshConversation.getWorkspaceId() !== workspaceId ||
          freshConversation.getScope() !== conversation.getScope() ||
          freshConversation.getPageId() !== conversation.getPageId() ||
          currentConversation.getScope() !== freshConversation.getScope() ||
          currentConversation.getPageId() !== freshConversation.getPageId() ||
          currentConversation.getWorkspaceId() !==
            freshConversation.getWorkspaceId()
        ) {
          throw new ForbiddenException(
            'AI generation conversation scope changed',
          );
        }
        await this.accessService.assertCanRead(
          freshConversation,
          params.userId,
          params.shareToken,
          context,
        );
        failureCode = 'AI_COMPLETION_ERROR';
        const outputData = this.resolveOutputData(
          params.capability,
          result.output,
        );

        generation.complete({
          outputData,
          provider: result.provider ?? null,
          model: result.model ?? null,
        });

        const completed = await this.generationRepository.save(
          generation,
          context,
        );

        await this.messageRepository.save(
          AiMessage.create({
            conversationId: params.conversationId,
            role: AiMessageRole.ASSISTANT,
            content: this.getAssistantMessageContent(outputData),
            metadata: {
              requestId: params.requestId,
              generationId,
              capability: params.capability,
              ...(result.provider ? { provider: result.provider } : {}),
              ...(result.model ? { model: result.model } : {}),
            },
          }),
          context,
        );

        if (result.usage) {
          if (!result.provider || !result.model) {
            throw new BadGatewayException(
              'AI runtime usage requires provider and model',
            );
          }

          await this.usageRepository.save(
            AiUsage.create({
              userId: params.userId,
              workspaceId,
              conversationId: params.conversationId,
              generationId,
              provider: result.provider,
              model: result.model,
              promptTokens: result.usage.promptTokens,
              completionTokens: result.usage.completionTokens,
              totalTokens: result.usage.totalTokens,
              estimatedCost: result.usage.estimatedCost ?? null,
              currency: result.usage.currency ?? null,
            }),
            context,
          );
        }

        return AiGenerationResponseDto.fromDomain(completed);
      });
    } catch (error: unknown) {
      try {
        await this.unitOfWork.runInTransaction(async (context) => {
          const generation =
            await this.generationRepository.findByIdAndUserIdForUpdate(
              generationId,
              params.userId,
              context,
            );

          if (
            generation?.getUserId() === params.userId &&
            generation.getStatus() === AiGenerationStatus.PROCESSING
          ) {
            generation.fail(
              failureCode,
              failureCode === 'AI_ACCESS_REVOKED'
                ? 'AI completion access is no longer available'
                : 'AI request failed',
            );

            await this.generationRepository.save(generation, context);
          }
        });
      } catch {
        // Preserve the original runtime/orchestration error for the caller.
      }

      throw error;
    }
  }

  private resolveOutputData(
    capability: string,
    output: Record<string, unknown> | string,
  ): Record<string, unknown> | string {
    if (capability !== PAGE_COMPOSITION_CAPABILITY) {
      return output;
    }

    const draft = this.pageCompositionDraftValidator.validate(output);

    return { ...draft };
  }

  private getAssistantMessageContent(
    output: Record<string, unknown> | string,
  ): string {
    if (typeof output === 'string') {
      return output;
    }

    if (typeof output.text === 'string' && output.text.trim()) {
      return output.text;
    }

    // The draft itself is shown by the preview card; history keeps a summary.
    if (output.type === 'PAGE_COMPOSITION') {
      const page = output.page as { title?: unknown } | undefined;
      const title = typeof page?.title === 'string' ? page.title.trim() : '';
      return title
        ? `Đã tạo bản nháp trang "${title}". Trang chỉ được tạo sau khi bạn xác nhận.`
        : 'Đã tạo bản nháp trang mới. Trang chỉ được tạo sau khi bạn xác nhận.';
    }

    return JSON.stringify(output);
  }
}
