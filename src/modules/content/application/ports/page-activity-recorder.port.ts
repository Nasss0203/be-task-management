import type { PersistenceContext } from 'src/shared/domain/persistence-context';

export type PageEditAction =
  | 'PAGE_CREATED'
  | 'PAGE_UPDATED'
  | 'PAGE_DELETED'
  | 'PAGE_RESTORED'
  | 'PAGE_BLOCK_CREATED'
  | 'PAGE_BLOCK_UPDATED'
  | 'PAGE_BLOCK_DELETED'
  | 'PAGE_BLOCK_REORDERED';

/** What a person did to a Page or one of its blocks (kế hoạch ghi activity). */
export interface PageEdit {
  /** No actor means system work: nothing is recorded. */
  actorId?: string | null;
  pageId: string;
  /** The block edited; absent for the Page itself or its block order. */
  blockId?: string;
  action: PageEditAction;
  /** MOVED / PRESET for Page updates, RESTORED for a block brought back. */
  kind?: 'MOVED' | 'PRESET' | 'RESTORED';
}

/** Lets M2 find "the Page I edited yesterday"; one row per burst of edits. */
export interface PageActivityRecorder {
  record(edit: PageEdit, context?: PersistenceContext): Promise<void>;
}
