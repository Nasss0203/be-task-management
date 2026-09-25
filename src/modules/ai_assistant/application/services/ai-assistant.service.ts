import {
  BadGatewayException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
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
import { AiGenerationResponseDto } from '../dto/response/ai-generation.response.dto';
import type { AiRuntimePort } from '../ports/ai-runtime.port';

export interface SubmitAiRequestParams {
  requestId: string;
  userId: string;
  conversationId: string;
  capability: string;
  content: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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
    private readonly authorizationService: AuthorizationService,
  ) {}

  async submit(
    params: SubmitAiRequestParams,
  ): Promise<AiGenerationResponseDto> {
    const conversation = await this.conversationRepository.findByIdAndUserId(
      params.conversationId,
      params.userId,
    );

    if (!conversation) {
      throw new NotFoundException('AI conversation not found');
    }

    const workspaceId = conversation.getWorkspaceId();
    if (workspaceId) {
      const allowed = await this.authorizationService.authorize({
        userId: params.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: workspaceId },
      });

      if (!allowed) {
        throw new ForbiddenException('Workspace access denied');
      }
    }

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

    try {
      const result = await this.runtime.execute({
        requestId: params.requestId,
        capability: params.capability,
        input: params.input,
        context: params.context,
      });

      return await this.unitOfWork.runInTransaction(async (context) => {
        const generation = await this.generationRepository.findByIdAndUserId(
          generationId,
          params.userId,
          context,
        );

        if (!generation) {
          throw new NotFoundException('AI generation not found');
        }

        generation.complete({
          outputData: result.output,
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
            content:
              typeof result.output === 'string'
                ? result.output
                : JSON.stringify(result.output),
            metadata: {
              requestId: params.requestId,
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
          const generation = await this.generationRepository.findByIdAndUserId(
            generationId,
            params.userId,
            context,
          );

          if (generation?.getStatus() === AiGenerationStatus.PROCESSING) {
            generation.fail(
              'AI_RUNTIME_ERROR',
              error instanceof Error ? error.message : 'AI runtime failed',
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
}
