import type { AiUsageSummary } from '../../../domain/repositories/ai-usage.repository';

export class AiUsageSummaryResponseDto {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: string;

  static fromSummary(summary: AiUsageSummary): AiUsageSummaryResponseDto {
    return {
      prompt_tokens: summary.promptTokens,
      completion_tokens: summary.completionTokens,
      total_tokens: summary.totalTokens,
      estimated_cost: summary.estimatedCost,
    };
  }
}
