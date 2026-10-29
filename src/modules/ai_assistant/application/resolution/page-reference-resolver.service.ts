import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import { AiConversationAccessService } from '../services/ai-conversation-access.service';
import type { PageScope } from './page-intent.types';
import type { PageResolutionReader } from './page-resolution.port';
import {
  DEFAULT_TIME_ZONE,
  isTimeZone,
  MAX_ACTIVITY_CANDIDATES,
  MAX_SENTENCE_CANDIDATES,
  MAX_SIMILAR_CANDIDATES,
  type ActivityPageResolutionResult,
  type PageResolutionCandidate,
  type ResolvePageFromActivityInput,
  type ResolveSimilarTitlesInput,
  type SimilarTitleResolutionResult,
  type PageResolutionResult,
  type ResolvePageFromSentenceInput,
  type ResolvePageReferenceInput,
  type SentencePageResolutionResult,
} from './page-resolution.types';
import {
  findPageTitlesInSentence,
  normalizeForTitleMatch,
} from './page-title-sentence-matcher';
import {
  SIMILAR_TITLE_THRESHOLD,
  similarTitleScorer,
} from './page-title-similarity';

// More textual matches than this are not worth authorizing one by one.
const MAX_SENTENCE_MATCHES_TO_AUTHORIZE = 25;

/** Same title: NFC and any case, else the same words without marks. */
function sameName(typed: string, title: string): boolean {
  const exact = (text: string) =>
    text.normalize('NFC').trim().toLocaleLowerCase('vi');
  return (
    exact(typed) === exact(title) ||
    (!!normalizeForTitleMatch(typed) &&
      normalizeForTitleMatch(typed) === normalizeForTitleMatch(title))
  );
}

@Injectable()
export class PageReferenceResolver {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.ports.PageResolutionReader)
    private readonly reader: PageResolutionReader,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly accessService: AiConversationAccessService,
  ) {}

  async resolve(input: ResolvePageReferenceInput): Promise<PageResolutionResult> {
    if (!input.userId?.trim() || !input.workspaceId?.trim()) {
      throw new BadRequestException('User and workspace are required');
    }

    // An explicitly named page takes precedence over the currently open page.
    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) throw new BadRequestException('Page title is required');

      const candidates = await this.reader.findAccessibleByExactTitle(
        input.userId,
        input.workspaceId,
        title,
      );
      const permitted = await Promise.all(
        candidates.map(async (candidate) => {
          if (candidate.getWorkspaceId() !== input.workspaceId) return null;
          return this.getAuthorizedPage(input, candidate.getId());
        }),
      );
      const matches = permitted
        .filter((page): page is Page => page !== null)
        .map((page) => this.toCandidate(page));

      if (matches.length === 0) return { status: 'NOT_FOUND', candidates: [] };
      if (matches.length > 1) return { status: 'AMBIGUOUS', candidates: matches };
      return {
        status: 'RESOLVED',
        page: matches[0],
        resolutionMethod: 'EXACT_TITLE',
        confidence: 1,
      };
    }

    if (!input.currentPageId?.trim()) {
      throw new BadRequestException('Page title or currentPageId is required');
    }

    const page = await this.getAuthorizedPage(input, input.currentPageId);
    if (!page) return { status: 'NOT_FOUND', candidates: [] };

    return {
      status: 'RESOLVED',
      page: this.toCandidate(page),
      resolutionMethod: 'CURRENT_CONTEXT',
      confidence: 1,
    };
  }

  async resolveFromSentence(
    input: ResolvePageFromSentenceInput,
  ): Promise<SentencePageResolutionResult> {
    if (!input.userId?.trim() || !input.workspaceId?.trim()) {
      throw new BadRequestException('User and workspace are required');
    }
    const pages = await this.reader.findAccessibleTitlesInWorkspace(
      input.userId,
      input.workspaceId,
    );
    const matchedIds = findPageTitlesInSentence(input.instruction, pages);
    if (matchedIds.length > MAX_SENTENCE_MATCHES_TO_AUTHORIZE) {
      return { status: 'TOO_MANY', candidates: [] };
    }

    // Authorize every candidate before revealing even its title.
    const permitted = await Promise.all(
      matchedIds.map((pageId) => this.getAuthorizedPage(input, pageId)),
    );
    const candidates = permitted
      .filter((page): page is Page => page !== null)
      .map((page) => this.toCandidate(page));

    if (candidates.length === 0) return { status: 'NOT_FOUND', candidates: [] };
    if (candidates.length > MAX_SENTENCE_CANDIDATES) {
      return { status: 'TOO_MANY', candidates: [] };
    }
    return {
      status: 'CANDIDATES',
      candidates,
      resolutionMethod: 'TITLE_IN_SENTENCE',
    };
  }

  /**
   * M4: the candidates that are in the place the user named: under an
   * ancestor Page with that title (any depth) and / or in that teamspace.
   * Ancestor titles are only compared, never returned.
   */
  async filterByScope(
    candidates: PageResolutionCandidate[],
    scope: PageScope,
  ): Promise<PageResolutionCandidate[]> {
    if (candidates.length === 0) return [];
    const places = await this.reader.findPagePlaces(
      candidates.map((candidate) => candidate.pageId),
    );
    // "dự án A" / "project A": the ancestor may be titled "A" or "Dự án A".
    const parentNames = scope.parentTitle
      ? [
          scope.parentTitle,
          scope.parentTitle.replace(/^\s*(?:dự án|du an|project)\s+/iu, ''),
        ]
      : [];
    return candidates.filter((candidate) => {
      const place = places.get(candidate.pageId);
      if (!place) return false;
      const underParent =
        !scope.parentTitle ||
        place.ancestorTitles.some((title) =>
          parentNames.some((name) => sameName(name, title)),
        );
      const inTeamspace =
        !scope.teamspaceName ||
        (place.teamspaceName !== null &&
          sameName(scope.teamspaceName, place.teamspaceName));
      return underParent && inTeamspace;
    });
  }

  /**
   * M3: real titles close to a typed name that matched nothing exactly.
   * Never resolves directly: the user confirms even a single suggestion.
   */
  async resolveSimilarTitles(
    input: ResolveSimilarTitlesInput,
  ): Promise<SimilarTitleResolutionResult> {
    if (!input.userId?.trim() || !input.workspaceId?.trim()) {
      throw new BadRequestException('User and workspace are required');
    }
    const pages = await this.reader.findAccessibleTitlesInWorkspace(
      input.userId,
      input.workspaceId,
    );
    const score = similarTitleScorer(input.title);
    const ranked = pages
      .map((page) => ({
        page,
        score: score(page.title),
      }))
      .filter(({ score }) => score >= SIMILAR_TITLE_THRESHOLD)
      .sort(
        (a, b) =>
          b.score - a.score || a.page.title.localeCompare(b.page.title, 'vi'),
      );

    // Authorize before revealing even a title (luật cứng #6).
    const candidates: PageResolutionCandidate[] = [];
    for (const { page: titled } of ranked) {
      const page = await this.getAuthorizedPage(input, titled.id);
      if (!page) continue;
      candidates.push(this.toCandidate(page));
      if (candidates.length === MAX_SIMILAR_CANDIDATES) break;
    }
    return candidates.length > 0
      ? { status: 'CANDIDATES', candidates, resolutionMethod: 'FUZZY_TITLE' }
      : { status: 'NOT_FOUND', candidates: [] };
  }

  /**
   * M2: Pages the user edited in the time named. Never resolves directly:
   * the user confirms even a single candidate (kế hoạch M2, B5).
   */
  async resolveFromActivity(
    input: ResolvePageFromActivityInput,
  ): Promise<ActivityPageResolutionResult> {
    if (!input.userId?.trim() || !input.workspaceId?.trim()) {
      throw new BadRequestException('User and workspace are required');
    }
    const timeZone = await this.chooseTimeZone(input.userId, input.timeZone);
    const edited = await this.reader.findRecentlyEditedPages(
      input.userId,
      input.workspaceId,
      {
        relative: input.activity.relative,
        days: input.activity.days,
        timeZone,
        now: input.now,
      },
    );
    const hint = input.activity.titleHint
      ? ` ${normalizeForTitleMatch(input.activity.titleHint)} `
      : null;
    const wanted =
      input.activity.relative === 'LATEST' ? 1 : MAX_ACTIVITY_CANDIDATES;

    const candidates: PageResolutionCandidate[] = [];
    for (const edit of edited) {
      // "trang release tôi sửa": whole words of the title, marks ignored.
      if (hint && !` ${normalizeForTitleMatch(edit.title)} `.includes(hint)) {
        continue;
      }
      const page = await this.getAuthorizedPage(input, edit.id);
      if (!page) continue;
      candidates.push(this.toCandidate(page));
      if (candidates.length === wanted) break;
    }
    return candidates.length > 0
      ? { status: 'CANDIDATES', candidates, resolutionMethod: 'ACTIVITY' }
      : { status: 'NOT_FOUND', candidates: [] };
  }

  /** The request's zone, else the profile's, else Việt Nam (§11 #7). */
  private async chooseTimeZone(
    userId: string,
    requested?: string | null,
  ): Promise<string> {
    if (requested && isTimeZone(requested)) return requested;
    const saved = await this.reader.findProfileTimeZone(userId);
    return saved && isTimeZone(saved) ? saved : DEFAULT_TIME_ZONE;
  }

  private async getAuthorizedPage(
    input: ResolvePageReferenceInput,
    pageId: string,
  ): Promise<Page | null> {
    try {
      const page = await this.accessService.getReadablePage(
        input.userId,
        pageId,
        input.shareToken,
      );
      // No target may escape the explicitly selected workspace.
      return page.getWorkspaceId() === input.workspaceId ? page : null;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        return null;
      }
      throw error;
    }
  }

  private toCandidate(page: Page): PageResolutionCandidate {
    return {
      pageId: page.getId(),
      workspaceId: page.getWorkspaceId(),
      title: page.getTitle(),
      parentPageId: page.getParentPageId(),
      teamspaceId: page.getTeamspaceId(),
    };
  }
}
