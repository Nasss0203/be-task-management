/** M2: how the user named the Page by their own edits; words only, no dates. */
export interface PageActivity {
  relative:
    | 'LATEST'
    | 'TODAY'
    | 'YESTERDAY'
    | 'N_DAYS_AGO'
    | 'LAST_WEEK'
    | 'RECENT';
  /** Only for N_DAYS_AGO (1–30). */
  days: number | null;
  /** Words of the title the user added ("trang release tôi sửa…"). */
  titleHint: string | null;
}

export type PageIntentExtraction =
  | {
      intent: 'MODIFY_PAGE';
      referenceType: 'TITLE' | 'CURRENT_PAGE' | 'UNRESOLVED';
      pageReference: string | null;
      instruction: string;
      needsClarification: boolean;
    }
  | {
      // Only the AI service's rules return it; the user always confirms the Page.
      intent: 'MODIFY_PAGE';
      referenceType: 'ACTIVITY';
      pageReference: null;
      instruction: string;
      needsClarification: false;
      activity: PageActivity;
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
