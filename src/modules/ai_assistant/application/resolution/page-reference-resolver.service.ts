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
import type { PageResolutionReader } from './page-resolution.port';
import {
  MAX_SENTENCE_CANDIDATES,
  type PageResolutionCandidate,
  type PageResolutionResult,
  type ResolvePageFromSentenceInput,
  type ResolvePageReferenceInput,
  type SentencePageResolutionResult,
} from './page-resolution.types';
import { findPageTitlesInSentence } from './page-title-sentence-matcher';

// More textual matches than this are not worth authorizing one by one.
const MAX_SENTENCE_MATCHES_TO_AUTHORIZE = 25;

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
    const pages = await this.reader.findAccessibleInWorkspace(
      input.userId,
      input.workspaceId,
    );
    const matchedIds = findPageTitlesInSentence(
      input.instruction,
      pages.map((page) => ({ id: page.getId(), title: page.getTitle() })),
    );
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
