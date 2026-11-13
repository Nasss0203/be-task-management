export const AI_INTENTS = [
  'CREATE_PAGE',
  'MODIFY_PAGE',
  'WRITING',
  'OTHER',
  'UNCLEAR',
  'PAGE_QUESTION',
] as const;
export const PAGE_QUESTION_KINDS = [
  'TODO_STATUS',
  'DATABASE_COUNT',
  'SUMMARY',
  'FREE',
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
export type PageQuestionKind = (typeof PAGE_QUESTION_KINDS)[number];

export interface AiIntentRequest {
  instruction: string;
  selectedText?: string | null;
  currentPageId?: string | null;
  pageTitles?: string[];
}

export interface AiIntentResult {
  result: {
    intent: AiIntent;
    writingAction: AiWritingAction | null;
    language: string | null;
    needsClarification: boolean;
    questionKind?: PageQuestionKind;
    pageReference?: string | null;
    databaseReference?: string | null;
  };
  provider: string;
  model: string;
}

export interface AiIntentPort {
  classify(request: AiIntentRequest): Promise<AiIntentResult>;
}
