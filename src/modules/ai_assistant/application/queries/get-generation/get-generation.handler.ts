import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';
import { AiModificationPlanValidatorService } from '../../services/ai-modification-plan-validator.service';

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
  ) {}

  async execute(query: GetGenerationQuery): Promise<AiGenerationResponseDto> {
    const generation = await this.generationRepository.findByIdAndUserId(
      query.generationId,
      query.userId,
    );

    if (!generation) {
      throw new NotFoundException('AI generation not found');
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

      const pageId = (inputData as Record<string, unknown>).pageId;

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

      const validatedPlan = this.planValidator.validate(
        generation.getOutputData(),
        context,
      );

      return AiGenerationResponseDto.fromDomain(generation, validatedPlan);
    }

    const workspaceId = generation.getWorkspaceId();

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

    return AiGenerationResponseDto.fromDomain(generation);
  }
}