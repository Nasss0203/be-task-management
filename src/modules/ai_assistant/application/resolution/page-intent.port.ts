import type { PageIntentResult } from './page-intent.types';

export interface PageIntentExtractor {
  extract(
    instruction: string,
    currentPageId?: string,
  ): Promise<PageIntentResult>;
}
