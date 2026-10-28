import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageActivity } from './page-intent.types';
import type { TitledPage } from './page-title-sentence-matcher';

/** M2: no more than this many Pages are read before the hint and authorization. */
export const MAX_RECENT_EDITED_PAGES = 50;

export interface RecentEditsQuery {
  relative: PageActivity['relative'];
  days: number | null;
  /** A valid IANA zone, already chosen (request, profile or default). */
  timeZone: string;
  /** Tests fix "now"; production uses the current time. */
  now?: Date;
}

/** A Page the user edited, from activities (kế hoạch ghi activity). */
export interface RecentlyEditedPage extends TitledPage {
  lastEditedAt: Date;
}

/** Only fetch scoped candidates; authorization is verified separately for each match. */
export interface PageResolutionReader {
  findAccessibleByExactTitle(
    userId: string,
    workspaceId: string,
    title: string,
  ): Promise<Page[]>;

  /** M1b: id and title of the workspace's live Pages, to find names in a sentence. */
  findAccessibleTitlesInWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<TitledPage[]>;

  /** M2: live Pages the user edited in the time named, newest edit first. */
  findRecentlyEditedPages(
    userId: string,
    workspaceId: string,
    query: RecentEditsQuery,
  ): Promise<RecentlyEditedPage[]>;

  /** The zone saved on the user's profile, if any (§11 #7). */
  findProfileTimeZone(userId: string): Promise<string | null>;
}
