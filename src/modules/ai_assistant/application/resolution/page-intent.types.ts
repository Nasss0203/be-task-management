export type PageIntentExtraction =
  | {
      intent: 'MODIFY_PAGE';
      referenceType: 'TITLE' | 'CURRENT_PAGE' | 'UNRESOLVED';
      pageReference: string | null;
      instruction: string;
      needsClarification: boolean;
    }
  | {
      intent: 'OTHER' | 'UNCLEAR';
      referenceType: 'UNRESOLVED';
      pageReference: null;
      instruction: null;
      needsClarification: boolean;
    };

export interface PageIntentResult {
  result: PageIntentExtraction;
  provider: string;
  model: string;
}
