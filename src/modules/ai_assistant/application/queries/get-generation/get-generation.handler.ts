import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';
import { AiModificationPlanValidatorService } from '../../services/ai-modification-plan-validator.service';
import { assertAiPageContextFresh } from '../../services/ai-page-context-fingerprint';

import { GetAiPageContextHandler } from '../get-ai-page-context/get-ai-page-context.handler';
import { GetAiPageContextQuery } from '../get-ai-page-context/get-ai-page-context.query';

import { GetGenerationQuery } from './get-generation.query';

@Injectable()
export class GetGenerationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly getAiPageContextHandler: GetAiPageContextHandler,
    private readonly planValidator: AiModificationPlanValidatorService,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly conversationAccessService: AiConversationAccessService,
  ) {}

  async execute(query: GetGenerationQuery): Promise<AiGenerationResponseDto> {
    const generation = await this.generationRepository.findByIdAndUserId(
      query.generationId,
      query.userId,
    );

    if (!generation || generation.getUserId() !== query.userId) {
      throw new NotFoundException('AI generation not found');
    }

    const conversationId = generation.getConversationId();
    if (conversationId !== null) {
      const conversation = await this.conversationRepository.findByIdAndUserId(
        conversationId,
        query.userId,
      );
      if (!conversation || conversation.getUserId() !== query.userId) {
        throw new NotFoundException('AI conversation not found');
      }
      if (generation.getWorkspaceId() !== conversation.getWorkspaceId()) {
        throw new ForbiddenException(
          'AI generation workspace does not match conversation',
        );
      }
      await this.conversationAccessService.assertCanRead(
        conversation,
        query.userId,
        query.shareToken,
      );
    }

    if (generation.getCapability() === AI_MODIFICATION_PLAN_CAPABILITY) {
      const inputData = generation.getInputData();

      if (
        inputData === null ||
        typeof inputData !== 'object' ||
        Array.isArray(inputData)
      ) {
        throw new InternalServerErrorException(
          'AI modification plan generation has invalid input data',
        );
      }

      const pageId = inputData.pageId;

      if (typeof pageId !== 'string' || pageId.trim().length === 0) {
        throw new InternalServerErrorException(
          'AI modification plan generation is missing pageId',
        );
      }

      const context = await this.getAiPageContextHandler.execute(
        new GetAiPageContextQuery(query.userId, pageId, query.shareToken),
      );

      const workspaceId = generation.getWorkspaceId();

      if (workspaceId !== context.page.workspaceId) {
        throw new ForbiddenException(
          'AI generation workspace scope does not match target page',
        );
      }

      // A PROCESSING/FAILED generation has no executable plan to validate.
      // Authorization and workspace checks above still apply.
      if (
        generation.getStatus() === AiGenerationStatus.PROCESSING ||
        generation.getStatus() === AiGenerationStatus.FAILED
      ) {
        return AiGenerationResponseDto.fromDomain(generation);
      }

      try {
        const validatedPlan = this.planValidator.validate(
          generation.getOutputData(),
          context,
        );
        return AiGenerationResponseDto.fromDomain(generation, validatedPlan);
      } catch (error) {
        if (!(error instanceof BadGatewayException)) throw error;
        try {
          assertAiPageContextFresh(inputData.pageContextFingerprint, context);
        } catch (staleError) {
          if (staleError instanceof ConflictException) {
            // The draft was validated when persisted, but its old anchors may
            // no longer exist. Allow history/Discard; Confirm still returns 409.
            return AiGenerationResponseDto.fromDomain(generation);
          }
          throw staleError;
        }
        throw error;
      }
    }

    const workspaceId = generation.getWorkspaceId();

    if (conversationId === null && workspaceId) {
      const allowed = await this.authorizationService.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_READ],
        target: { type: 'workspace', id: workspaceId },
      });

      if (!allowed) {
        throw new ForbiddenException('Workspace access denied');
      }
    }

    return AiGenerationResponseDto.fromDomain(generation);
  }
}
