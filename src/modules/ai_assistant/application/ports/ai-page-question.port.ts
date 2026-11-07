import type { PageQuestionKind } from './ai-intent.port';

/** AI-Q1: one question about one Page; the context is already authorized. */
export interface AiPageQuestionRequest {
  question: string;
  questionKind: PageQuestionKind;
  databaseReference?: string | null;
  context: Record<string, unknown>;
}

export interface AiPageQuestionResult {
  answer: string;
  usedModel: boolean;
  facts: Record<string, unknown>;
  provider: string;
  model: string;
}

export interface AiPageQuestionPort {
  answerPageQuestion(
    request: AiPageQuestionRequest,
  ): Promise<AiPageQuestionResult>;
}
