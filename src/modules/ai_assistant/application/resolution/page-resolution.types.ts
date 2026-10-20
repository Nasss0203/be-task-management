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
