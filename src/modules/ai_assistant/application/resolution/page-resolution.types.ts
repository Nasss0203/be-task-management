/** Phase 1 resolves explicit page references only; natural-language extraction comes later. */
export interface ResolvePageReferenceInput {
  userId: string;
  workspaceId: string;
  title?: string;
  currentPageId?: string;
  shareToken?: string;
}

export interface PageResolutionCandidate {
  pageId: string;
  workspaceId: string;
  title: string;
  parentPageId: string | null;
  teamspaceId: string | null;
}

export type PageResolutionResult =
  | {
      status: 'RESOLVED';
      page: PageResolutionCandidate;
      resolutionMethod: 'CURRENT_CONTEXT' | 'EXACT_TITLE';
      confidence: 1;
    }
  | {
      status: 'AMBIGUOUS';
      candidates: PageResolutionCandidate[];
    }
  | {
      status: 'NOT_FOUND';
      candidates: [];
    };

/** M1b: a real Page title found next to "trang"/"page" in the sentence. */
export const MAX_SENTENCE_CANDIDATES = 5;

export interface ResolvePageFromSentenceInput {
  userId: string;
  workspaceId: string;
  instruction: string;
  shareToken?: string;
}

/** Never resolves directly: every candidate needs an explicit user choice. */
export type SentencePageResolutionResult =
  | {
      status: 'CANDIDATES';
      candidates: PageResolutionCandidate[];
      resolutionMethod: 'TITLE_IN_SENTENCE';
    }
  | { status: 'TOO_MANY'; candidates: [] }
  | { status: 'NOT_FOUND'; candidates: [] };
