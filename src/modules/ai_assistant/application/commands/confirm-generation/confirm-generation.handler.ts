import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';

import { ConfirmAiModificationPlanCommand } from '../confirm-ai-modification-plan/confirm-ai-modification-plan.command';
import {
  ConfirmAiModificationPlanHandler,
  type ConfirmAiModificationPlanResult,
} from '../confirm-ai-modification-plan/confirm-ai-modification-plan.handler';

import { ConfirmPageCompositionCommand } from '../confirm-page-composition/confirm-page-composition.command';
import {
  ConfirmPageCompositionHandler,
  type ConfirmPageCompositionResult,
} from '../confirm-page-composition/confirm-page-composition.handler';

import { ConfirmGenerationCommand } from './confirm-generation.command';

export type ConfirmGenerationResult =
  | ConfirmPageCompositionResult
  | ConfirmAiModificationPlanResult;

@Injectable()
export class ConfirmGenerationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,

    private readonly confirmPageCompositionHandler: ConfirmPageCompositionHandler,

    private readonly confirmAiModificationPlanHandler: ConfirmAiModificationPlanHandler,
  ) {}

  async execute(
    command: ConfirmGenerationCommand,
  ): Promise<ConfirmGenerationResult> {
    const generation = await this.generationRepository.findByIdAndUserId(
      command.generationId,
      command.userId,
    );

    if (!generation) {
      throw new NotFoundException('AI generation not found');
    }

    switch (generation.getCapability()) {
      case PAGE_COMPOSITION_CAPABILITY:
        return this.confirmPageCompositionHandler.execute(
          new ConfirmPageCompositionCommand(
            command.userId,
            command.generationId,
            command.teamspaceId ?? null,
            command.parentPageId ?? null,
          ),
        );

      case AI_MODIFICATION_PLAN_CAPABILITY:
        return this.confirmAiModificationPlanHandler.execute(
          new ConfirmAiModificationPlanCommand(
            command.userId,
            command.generationId,
            command.shareToken,
          ),
        );

      default:
        throw new BadRequestException(
          'AI generation capability does not support confirmation',
        );
    }
  }
}
