import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';

/** Only fetch scoped candidates; authorization is verified separately for each match. */
export interface PageResolutionReader {
  findAccessibleByExactTitle(
    userId: string,
    workspaceId: string,
    title: string,
  ): Promise<Page[]>;
}
