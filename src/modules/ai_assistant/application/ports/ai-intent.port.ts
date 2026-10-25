export const AI_INTENTS = [
  'CREATE_PAGE',
  'MODIFY_PAGE',
  'WRITING',
  'OTHER',
  'UNCLEAR',
] as const;
export const WRITING_ACTIONS = [
  'IMPROVE',
  'SHORTEN',
  'EXPAND',
  'SUMMARIZE',
  'CONTINUE',
  'TRANSLATE',
] as const;
export type AiIntent = (typeof AI_INTENTS)[number];
export type AiWritingAction = (typeof WRITING_ACTIONS)[number];

export interface AiIntentRequest {
  instruction: string;
  selectedText?: string | null;
  currentPageId?: string | null;
}

export interface AiIntentResult {
  result: {
    intent: AiIntent;
    writingAction: AiWritingAction | null;
    language: string | null;
    needsClarification: boolean;
  };
  provider: string;
  model: string;
}

export interface AiIntentPort {
  classify(request: AiIntentRequest): Promise<AiIntentResult>;
}
