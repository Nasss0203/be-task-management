import {
  AiGeneration,
  type AiGenerationData,
} from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';

export class AiGenerationResponseDto {
  id: string;
  conversation_id: string | null;
  workspace_id: string | null;
  capability: string;
  status: AiGenerationStatus;
  output_data: AiGenerationData;
  provider: string | null;
  model: string | null;
  error_code: string | null;
  error_message: string | null;
  applied_at: Date | null;
  created_at: Date;
  updated_at: Date;

  static fromDomain(generation: AiGeneration): AiGenerationResponseDto {
    return {
      id: generation.getId(),
      conversation_id: generation.getConversationId(),
      workspace_id: generation.getWorkspaceId(),
      capability: generation.getCapability(),
      status: generation.getStatus(),
      output_data: generation.getOutputData(),
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
