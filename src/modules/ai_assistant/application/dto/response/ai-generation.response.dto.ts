import {
  AiGeneration,
  type AiGenerationData,
} from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';

import type { AiModificationPlan } from '../../types/ai-modification-plan';
import type { PageCompositionDraft } from '../../types/page-composition-draft';

import { AiModificationPlanPreviewResponseDto } from './ai-modification-plan-preview.response.dto';
import { PageCompositionPreviewResponseDto } from './page-composition-preview.response.dto';

export class AiGenerationResponseDto {
  id: string;
  conversation_id: string | null;
  workspace_id: string | null;
  capability: string;
  status: AiGenerationStatus;
  output_data: AiGenerationData;

  preview?:
    | PageCompositionPreviewResponseDto
    | AiModificationPlanPreviewResponseDto;

  provider: string | null;
  model: string | null;
  error_code: string | null;
  error_message: string | null;
  applied_at: Date | null;
  created_at: Date;
  updated_at: Date;

  static fromDomain(
    generation: AiGeneration,
    validatedModificationPlan?: AiModificationPlan,
  ): AiGenerationResponseDto {
    const outputData = generation.getOutputData();

    const pageCompositionPreview =
      generation.getCapability() === PAGE_COMPOSITION_CAPABILITY &&
      outputData !== null &&
      typeof outputData === 'object' &&
      !Array.isArray(outputData)
        ? PageCompositionPreviewResponseDto.fromDraft(
            outputData as unknown as PageCompositionDraft,
          )
        : undefined;

    const modificationPlanPreview =
      generation.getCapability() === AI_MODIFICATION_PLAN_CAPABILITY &&
      validatedModificationPlan !== undefined
        ? AiModificationPlanPreviewResponseDto.fromPlan(
            validatedModificationPlan,
          )
        : undefined;

    const preview = modificationPlanPreview ?? pageCompositionPreview;

    return {
      id: generation.getId(),
      conversation_id: generation.getConversationId(),
      workspace_id: generation.getWorkspaceId(),
      capability: generation.getCapability(),
      status: generation.getStatus(),
      output_data: outputData,
      ...(preview ? { preview } : {}),
      provider: generation.getProvider(),
      model: generation.getModel(),
      error_code: generation.getErrorCode(),
      error_message: generation.getErrorMessage(),
      applied_at: generation.getAppliedAt(),
      created_at: generation.getCreatedAt(),
      updated_at: generation.getUpdatedAt(),
    };
  }
}
