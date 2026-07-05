import { AiProvider } from '../../domain/enums/ai-provider.enum';

export type AiGenerationResult = {
  assistantMessage: string;
  outputData: Record<string, unknown>;
  provider: AiProvider;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
};
