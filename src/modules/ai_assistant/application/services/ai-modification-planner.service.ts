import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import { AiGeneration } from '../../domain/aggregates/ai-generation/ai-generation.aggregate';
import type { AiGenerationRepository } from '../../domain/repositories/ai-generation.repository';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../constants/ai-modification-plan.constant';
import type { AiRuntimePort } from '../ports/ai-runtime.port';
import { GetAiPageContextHandler } from '../queries/get-ai-page-context/get-ai-page-context.handler';
import { GetAiPageContextQuery } from '../queries/get-ai-page-context/get-ai-page-context.query';
import type { AiModificationPlan } from '../types/ai-modification-plan';
import { AiModificationPlanValidatorService } from './ai-modification-plan-validator.service';

export interface GenerateAiModificationPlanParams {
  requestId: string;
  userId: string;
  pageId: string;
  instruction: string;
  shareToken?: string;
}

export type GenerateAiModificationPlanResult = AiModificationPlan & {
  generationId: string;
};

@Injectable()
export class AiModificationPlannerService {
  constructor(
    private readonly getAiPageContextHandler: GetAiPageContextHandler,

    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,

    @Inject(AI_ASSISTANT_TYPES.runtime.AiRuntime)
    private readonly runtime: AiRuntimePort,

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

    const context = await this.getAiPageContextHandler.execute(
      new GetAiPageContextQuery(
        params.userId,
        params.pageId,
        params.shareToken,
      ),
    );

    const runtimeResult = await this.runtime.execute({
      requestId: params.requestId,
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
      content: params.instruction,
      input: {},
      context: {
        ...context,
      },
    });

    const validatedPlan = this.planValidator.validate(
      runtimeResult.output,
      context,
    );

    const generation = AiGeneration.create({
      conversationId: null,
      userId: params.userId,
      workspaceId: context.page.workspaceId,
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
      inputData: {
        pageId: context.page.id,
        instruction: params.instruction,
        requestId: params.requestId,
      },
    });

    generation.complete({
      outputData: { ...validatedPlan },
      provider: runtimeResult.provider ?? null,
      model: runtimeResult.model ?? null,
    });

    const savedGeneration = await this.generationRepository.save(generation);

    return {
      generationId: savedGeneration.getId(),
      ...validatedPlan,
    };
  }
}
