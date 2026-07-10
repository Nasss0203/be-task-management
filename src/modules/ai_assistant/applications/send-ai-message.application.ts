import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { AiGenerationStatus } from '../domain/enums/ai-generation-status.enum';
import { AiGenerationType } from '../domain/enums/ai-generation-type.enum';
import { AiMessageRole } from '../domain/enums/ai-message-role.enum';
import { AiProvider } from '../domain/enums/ai-provider.enum';
import { SendAiMessageDto } from '../dto/send-ai-message.dto';
import { SendAiMessageResponseDto } from '../dto/response/send-ai-message.response.dto';
import { SendAiMessageApplication } from '../interfaces/applications/send-ai-message.application.interface';
import { type ApplyAiGenerationApplication } from '../interfaces/applications/apply-ai-generation.application.interface';
import { type AiContextSnapshotRepository } from '../interfaces/repositories/ai-context-snapshot.repository.interface';
import { type AiConversationService } from '../interfaces/services/ai-conversation.service.interface';
import { type AiGenerationService } from '../interfaces/services/ai-generation.service.interface';
import { type AiMessageService } from '../interfaces/services/ai-message.service.interface';
import { type AiProviderService } from '../interfaces/services/ai-provider.service.interface';

import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { AiGenerationMapper } from '../mapper/ai-generation.mapper';
import { AiMessageMapper } from '../mapper/ai-message.mapper';
import { AiGenerationResult } from '../interfaces/types/ai-generation-result.type';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type FindPermissionService } from 'src/modules/permission/interfaces/services/find-all-permission.service.interface';
import { PERMISSION_TYPES } from 'src/modules/permission/interfaces/types';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { GEMINI_DEFAULT_MODEL } from '../services/gemini-ai.constant';

@Injectable()
export class SendAiMessageApplicationImpl implements SendAiMessageApplication {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationService)
    private readonly conversationService: AiConversationService,

    @Inject(AI_ASSISTANT_TYPES.services.AiMessageService)
    private readonly messageService: AiMessageService,

    @Inject(AI_ASSISTANT_TYPES.services.AiGenerationService)
    private readonly generationService: AiGenerationService,

    @Inject(AI_ASSISTANT_TYPES.services.AiProviderService)
    private readonly aiProviderService: AiProviderService,

    @Inject(AI_ASSISTANT_TYPES.repositories.AiContextSnapshotRepository)
    private readonly contextSnapshotRepository: AiContextSnapshotRepository,

    @Inject(PERMISSION_TYPES.services.FindPermissionService)
    private readonly findPermissionService: FindPermissionService,

    @Inject(AI_ASSISTANT_TYPES.applications.ApplyAiGenerationApplication)
    private readonly applyAiGenerationApplication: ApplyAiGenerationApplication,

    private readonly configService: ConfigService,
  ) {}


  async send(
    input: Parameters<SendAiMessageApplication['send']>[0],
  ): Promise<SendAiMessageResponseDto> {
    const conversation = await this.conversationService.findByIdForUser(
      input.conversationId,
      input.userId,
    );

    const message = this.getMessage(input.dto);
    this.validateGenerationRequest(input.dto);

    let resolvedGenerationType = input.dto.generationType;
    if (!resolvedGenerationType && message) {
      const classification = await this.aiProviderService.classifyIntent(message);
      if (classification !== 'NORMAL') {
        resolvedGenerationType = classification;
      }
    }

    const supportedTypes = [
      AiGenerationType.TASK_DRAFT,
      AiGenerationType.WORKSPACE_DRAFT,
      AiGenerationType.PROJECT_DRAFT,
      AiGenerationType.WORKSPACE_TREE_DRAFT,
    ];

    if (
      resolvedGenerationType != null &&
      !supportedTypes.includes(resolvedGenerationType)
    ) {
      throw new NotImplementedException(
        `Generation type ${resolvedGenerationType} is not implemented yet`,
      );
    }

    const resolvedContext =
      resolvedGenerationType === AiGenerationType.TASK_DRAFT ||
      resolvedGenerationType === AiGenerationType.PROJECT_DRAFT
        ? await this.contextSnapshotRepository.resolveTaskDraftContext({
            workspaceId: input.dto.workspaceId ?? conversation.workspaceId,
            projectId: input.dto.projectId ?? null,
            boardId: input.dto.boardId ?? null,
            sprintId: input.dto.sprintId ?? null,
            metadata: input.dto.context ?? null,
          })
        : null;

    if (resolvedContext) {
      if (resolvedGenerationType === AiGenerationType.TASK_DRAFT) {
        await this.assertCanCreateTask(
          input.userId,
          input.systemRole,
          resolvedContext.context.workspaceId,
        );
      } else if (resolvedGenerationType === AiGenerationType.PROJECT_DRAFT) {
        await this.assertCanCreateProject(
          input.userId,
          input.systemRole,
          resolvedContext.context.workspaceId,
        );
      }
    }

    const messageContext =
      resolvedContext?.context ?? this.buildMessageContext(input.dto);
    const userMessage = await this.messageService.create({
      role: AiMessageRole.USER,
      conversationId: conversation.id,
      content: message,
      context: messageContext,
      metadata: input.dto.metadata ?? null,
    });

    await this.conversationService.update({
      id: conversation.id,
      userId: input.userId,
      lastMessageAt: userMessage.createdAt,
    });

    const isGenerationType =
      resolvedGenerationType === AiGenerationType.TASK_DRAFT ||
      resolvedGenerationType === AiGenerationType.WORKSPACE_DRAFT ||
      resolvedGenerationType === AiGenerationType.PROJECT_DRAFT ||
      resolvedGenerationType === AiGenerationType.WORKSPACE_TREE_DRAFT;

    if (!isGenerationType) {
      return {
        userMessage: AiMessageMapper.toResponse(userMessage),
        assistantMessage: null,
        generation: null,
      };
    }

    if (
      resolvedGenerationType !== AiGenerationType.WORKSPACE_DRAFT &&
      resolvedGenerationType !== AiGenerationType.WORKSPACE_TREE_DRAFT &&
      !resolvedContext
    ) {
      throw new BadRequestException(
        'AI context is required for draft generation',
      );
    }


    const generation = await this.generationService.create({
      userId: input.userId,
      conversationId: conversation.id,
      requestMessageId: userMessage.id,
      workspaceId: resolvedContext?.context.workspaceId ?? null,
      projectId: resolvedContext?.context.projectId ?? null,
      boardId: resolvedContext?.context.boardId ?? null,
      sprintId: resolvedContext?.context.sprintId ?? null,
      generationType: resolvedGenerationType!,
      inputText: message,
      inputContext: messageContext,
      outputData: null,
      provider: AiProvider.GEMINI,
      model: this.getConfiguredGeminiModel(),
      status: AiGenerationStatus.PROCESSING,
    });

    try {
      let result: AiGenerationResult;
      if (resolvedGenerationType === AiGenerationType.TASK_DRAFT) {
        result = await this.aiProviderService.generateTaskDraft({
          userId: input.userId,
          conversationId: conversation.id,
          message,
          context: resolvedContext!.context,
          contextSnapshot: resolvedContext!.contextSnapshot,
        });
      } else if (
        resolvedGenerationType === AiGenerationType.WORKSPACE_DRAFT
      ) {
        result = await this.aiProviderService.generateWorkspaceDraft({
          userId: input.userId,
          conversationId: conversation.id,
          message,
          context: messageContext ?? {},
        });
      } else if (
        resolvedGenerationType === AiGenerationType.PROJECT_DRAFT
      ) {
        result = await this.aiProviderService.generateProjectDraft({
          userId: input.userId,
          conversationId: conversation.id,
          message,
          context: resolvedContext!.context,
          contextSnapshot: resolvedContext!.contextSnapshot,
        });
      } else {
        result = await this.aiProviderService.generateWorkspaceTreeDraft({
          userId: input.userId,
          conversationId: conversation.id,
          message,
          context: messageContext ?? {},
        });
      }



      const updatedGeneration =
        await this.generationService.updateGeneratedResult({
          id: generation.id,
          userId: input.userId,
          outputData: result.outputData,
          provider: result.provider,
          model: result.model,
          inputTokens: result.inputTokens ?? null,
          outputTokens: result.outputTokens ?? null,
          totalTokens: result.totalTokens ?? null,
          status: AiGenerationStatus.GENERATED,
        });

      const assistantMessage = await this.messageService.create({
        conversationId: conversation.id,
        role: AiMessageRole.ASSISTANT,
        content: result.assistantMessage,
        context: messageContext,
        metadata: {
          generationId: updatedGeneration.id,
          generationType: input.dto.generationType,
        },
      });

      await this.conversationService.update({
        id: conversation.id,
        userId: input.userId,
        lastMessageAt: assistantMessage.createdAt,
      });

      let finalGeneration = updatedGeneration;
      if (input.dto.autoApply === true) {
        finalGeneration = await this.applyAiGenerationApplication.apply({
          generationId: updatedGeneration.id,
          userId: input.userId,
          dto: {
            appliedResults: [],
          },
        });
      }

      return {
        userMessage: AiMessageMapper.toResponse(userMessage),
        assistantMessage: AiMessageMapper.toResponse(assistantMessage),
        generation: AiGenerationMapper.toResponse(finalGeneration),
      };

    } catch (error) {
      await this.generationService.updateStatus({
        id: generation.id,
        userId: input.userId,
        status: AiGenerationStatus.FAILED,
        errorMessage: this.toSafeProviderErrorMessage(error),
      });

      throw this.toSafeHttpException(error);
    }
  }

  private validateGenerationRequest(dto: SendAiMessageDto): void {
    if (!dto.generationType) {
      return;
    }

    if (dto.provider && dto.provider !== AiProvider.GEMINI) {
      throw new BadRequestException(
        'Only GEMINI provider is supported for generation',
      );
    }

    if (
      dto.generationType === AiGenerationType.WORKSPACE_TREE_DRAFT &&
      dto.autoApply === true
    ) {
      throw new BadRequestException(
        'Auto-apply is not supported for Workspace Tree draft',
      );
    }
  }


  private getMessage(dto: SendAiMessageDto): string {
    const message = dto.message?.trim() || dto.content?.trim();

    if (!message) {
      throw new BadRequestException('message is required');
    }

    return message;
  }

  private async assertCanCreateTask(
    userId: string,
    systemRole: SystemRole,
    workspaceId: string,
  ): Promise<void> {
    if (systemRole === SystemRole.SUPER_ADMIN) {
      return;
    }

    const permissions =
      await this.findPermissionService.findPermissionsByUserAndWorkspace(
        userId,
        workspaceId,
      );

    if (!permissions.includes(PERMISSIONS.TASK_CREATE)) {
      throw new ForbiddenException('You do not have required permissions');
    }
  }

  private async assertCanCreateProject(
    userId: string,
    systemRole: SystemRole,
    workspaceId: string,
  ): Promise<void> {
    if (systemRole === SystemRole.SUPER_ADMIN) {
      return;
    }

    const permissions =
      await this.findPermissionService.findPermissionsByUserAndWorkspace(
        userId,
        workspaceId,
      );

    if (!permissions.includes(PERMISSIONS.PROJECT_CREATE)) {
      throw new ForbiddenException(
        'You do not have required permissions to create project',
      );
    }
  }

  private getConfiguredGeminiModel(): string {
    return (
      this.configService.get<string>('GEMINI_MODEL')?.trim() ||
      GEMINI_DEFAULT_MODEL
    );
  }

  private toSafeProviderErrorMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = (response as { message?: unknown }).message;
        return Array.isArray(message)
          ? message.join('; ')
          : typeof message === 'string'
            ? message
            : 'AI provider request failed';
      }
    }

    return 'AI provider request failed';
  }

  private toSafeHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    return new BadGatewayException('AI provider request failed');
  }

  private buildMessageContext(
    dto: SendAiMessageDto,
  ): Record<string, unknown> | null {
    const context: Record<string, unknown> = {
      ...(dto.context ?? {}),
    };

    if (dto.workspaceId) context.workspaceId = dto.workspaceId;
    if (dto.projectId) context.projectId = dto.projectId;
    if (dto.boardId) context.boardId = dto.boardId;
    if (dto.sprintId) context.sprintId = dto.sprintId;

    return Object.keys(context).length > 0 ? context : null;
  }
}
