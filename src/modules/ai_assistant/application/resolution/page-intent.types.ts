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

/** M4: where the titled Page is; there is no project entity (kế hoạch M4, E1). */
export interface PageScope {
  /** An ancestor Page's title at any depth; "dự án A" also tries "A". */
  parentTitle: string | null;
  teamspaceName: string | null;
}

export type PageIntentExtraction =
  | {
      intent: 'MODIFY_PAGE';
      /** M8: the source the user named ("dựa trên …"), in their own words. */
      basedOn?: string;
      referenceType: 'TITLE' | 'CURRENT_PAGE' | 'UNRESOLVED';
      pageReference: string | null;
      instruction: string;
      needsClarification: boolean;
      /** Only on a TITLE the AI service's rules placed (M4). */
      scope?: PageScope;
    }
  | {
      // Only the AI service's rules return it; the user always confirms the Page.
      intent: 'MODIFY_PAGE';
      /** M8: the source the user named ("dựa trên …"), in their own words. */
      basedOn?: string;
      referenceType: 'ACTIVITY';
      pageReference: null;
      instruction: string;
      needsClarification: false;
      activity: PageActivity;
    }
  | {
      // M6: only the AI service's rules return it; the user always picks the Page.
      intent: 'MODIFY_PAGE';
      /** M8: the source the user named ("dựa trên …"), in their own words. */
      basedOn?: string;
      referenceType: 'DESCRIPTION';
      pageReference: null;
      instruction: string;
      needsClarification: false;
      /** What the Page is for, in the user's own words. */
      description: string;
    }
  | {
      // M7: only the AI service's rules return it; the user always picks the Page.
      intent: 'MODIFY_PAGE';
      /** M8: the source the user named ("dựa trên …"), in their own words. */
      basedOn?: string;
      referenceType: 'CONTENT';
      pageReference: null;
      instruction: string;
      needsClarification: false;
      /** Words inside the Page, in the user's own words. */
      topic: string;
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
