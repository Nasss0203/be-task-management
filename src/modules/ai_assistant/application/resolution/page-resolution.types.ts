import type { PageActivity } from './page-intent.types';

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

/** M3: at most this many close titles are offered (kế hoạch tên gần đúng, C3). */
export const MAX_SIMILAR_CANDIDATES = 5;

export interface ResolveSimilarTitlesInput {
  userId: string;
  workspaceId: string;
  /** The name the user typed, which matched no title exactly. */
  title: string;
  shareToken?: string;
}

/** Never resolves directly: every suggestion needs an explicit user choice. */
export type SimilarTitleResolutionResult =
  | {
      status: 'CANDIDATES';
      candidates: PageResolutionCandidate[];
      resolutionMethod: 'FUZZY_TITLE';
    }
  | { status: 'NOT_FOUND'; candidates: [] };

/** M2: at most this many Pages the user edited are offered (LATEST offers 1). */
export const MAX_ACTIVITY_CANDIDATES = 5;
/** plan-v2 §11 #7: used when neither the request nor the profile has a zone. */
export const DEFAULT_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function isTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export interface ResolvePageFromActivityInput {
  userId: string;
  workspaceId: string;
  activity: PageActivity;
  /** The browser's zone from the Ask request; checked before use. */
  timeZone?: string | null;
  shareToken?: string;
  /** Tests fix "now". */
  now?: Date;
}

/** Never resolves directly: every candidate needs an explicit user choice. */
export type ActivityPageResolutionResult =
  | {
      status: 'CANDIDATES';
      candidates: PageResolutionCandidate[];
      resolutionMethod: 'ACTIVITY';
    }
  | { status: 'NOT_FOUND'; candidates: [] };
