import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';

import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import type { PageResolutionCandidate } from '../resolution/page-resolution.types';
import { AiConversationAccessService } from '../services/ai-conversation-access.service';
import {
  MAX_EMBEDDING_TEXT_LENGTH,
  VECTORS_PER_WORKSPACE_WARNING,
  type EmbeddingResourceType,
  type PageEmbeddingStore,
  type TextEmbedder,
} from './page-embedding.port';

export interface PageEmbeddingSearchInput {
  userId: string;
  workspaceId: string;
  query: string;
  /** PAGE: title and headers (M6); BLOCK: block text (M7); both when absent. */
  resourceType?: EmbeddingResourceType;
  limit?: number;
  shareToken?: string;
}

export interface PageEmbeddingMatch {
  pageId: string;
  /** The readable Page, as the user is offered it (M6). */
  page: PageResolutionCandidate;
  /** Cosine similarity of the Page's best row. */
  score: number;
  /** The block that matched best, when it was a block. */
  blockId: string | null;
}

const DEFAULT_LIMIT = 5;
// Pages checked for access before giving up on filling the list.
const MAX_ACCESS_CHECKS = 50;

/**
 * M5 (F7): the Pages of one workspace closest to a sentence. Vectors carry no
 * access rights, so every Page is checked for the user before it is returned.
 */
@Injectable()
export class PageEmbeddingSearch {
  private readonly logger = new Logger(PageEmbeddingSearch.name);

  constructor(
    @Inject(AI_ASSISTANT_TYPES.ports.PageEmbeddingStore)
    private readonly store: PageEmbeddingStore,
    @Inject(AI_ASSISTANT_TYPES.ports.TextEmbedder)
    private readonly embedder: TextEmbedder,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly accessService: AiConversationAccessService,
  ) {}

  async search(input: PageEmbeddingSearchInput): Promise<PageEmbeddingMatch[]> {
    const query = input.query
      .normalize('NFC')
      .replace(/\s+/gu, ' ')
      .trim()
      .slice(0, MAX_EMBEDDING_TEXT_LENGTH);
    if (!query) return [];

    const { model, embeddings } = await this.embedder.embed('query', [query]);
    const [vector] = embeddings;
    const rows = await this.store.findWorkspaceVectors(
      input.workspaceId,
      model,
      input.resourceType,
    );
    if (rows.length > VECTORS_PER_WORKSPACE_WARNING)
      this.logger.warn(
        `page_embedding_search_large workspace=${input.workspaceId} vectors=${rows.length}`,
      );

    const best = new Map<string, Omit<PageEmbeddingMatch, 'page'>>();
    for (const row of rows) {
      if (row.embedding.length !== vector.length) continue;
      const score = dot(vector, row.embedding);
      const current = best.get(row.pageId);
      if (!current || score > current.score)
        best.set(row.pageId, {
          pageId: row.pageId,
          score,
          blockId: row.resourceType === 'BLOCK' ? row.blockId : null,
        });
    }

    const limit = input.limit ?? DEFAULT_LIMIT;
    const matches: PageEmbeddingMatch[] = [];
    const ranked = [...best.values()].sort((a, b) => b.score - a.score);
    for (const match of ranked.slice(0, MAX_ACCESS_CHECKS)) {
      const page = await this.readablePage(input, match.pageId);
      if (page)
        matches.push({
          ...match,
          page: {
            pageId: page.getId(),
            workspaceId: page.getWorkspaceId(),
            title: page.getTitle(),
            parentPageId: page.getParentPageId(),
            teamspaceId: page.getTeamspaceId(),
          },
        });
      if (matches.length === limit) break;
    }
    return matches;
  }

  private async readablePage(
    input: PageEmbeddingSearchInput,
    pageId: string,
  ): Promise<Page | null> {
    try {
      const page = await this.accessService.getReadablePage(
        input.userId,
        pageId,
        input.shareToken,
      );
      // No match may escape the workspace asked about.
      return page.getWorkspaceId() === input.workspaceId ? page : null;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        return null;
      throw error;
    }
  }
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let index = 0; index < a.length; index++) sum += a[index] * b[index];
  return sum;
}
