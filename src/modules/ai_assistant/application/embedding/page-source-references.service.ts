import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import { PageReferenceResolver } from '../resolution/page-reference-resolver.service';
import { blockText, excerptOf } from './page-embedding-chunks';
import type { PageEmbeddingStore } from './page-embedding.port';
import { PageEmbeddingSearch } from './page-embedding-search.service';

// M8 (kế hoạch ngữ cảnh RAG, I3, I4): what the planner may read from other
// Pages. The AI service checks the same limits.
export const MAX_REFERENCES = 8;
export const MAX_REFERENCES_PER_PAGE = 3;
export const MAX_REFERENCE_TEXT_LENGTH = 400;
export const MAX_REFERENCES_BYTES = 3000;
const MAX_SECTION_LENGTH = 255;

/** A passage of another Page, as the planner reads it: no Page or block ID. */
export interface PlanReference {
  label: string;
  pageTitle: string;
  text: string;
  /**
   * Only for a named source Page, read whole: the heading the passage sits
   * under, or that it is a heading itself. A checklist "các bug blocker" then
   * takes the items under "Bug blocker" without the model.
   */
  section?: string;
  isHeading?: true;
}

/** A Page the draft was based on, shown to the user (I7). */
export interface PlanSource {
  pageId: string;
  title: string;
}

export type SourceReferences =
  | { status: 'FOUND'; references: PlanReference[]; sources: PlanSource[] }
  | { status: 'NOT_FOUND' };

export interface CollectSourceReferencesInput {
  userId: string;
  workspaceId: string;
  /** The source the user named ("trang Bug tracker", "ghi chú QA gần đây"). */
  basedOn: string;
  /** The Page being edited: its own text is already in the planner's context. */
  targetPageId: string;
  shareToken?: string;
}

interface Passage {
  pageId: string;
  title: string;
  text: string;
  section?: string;
  isHeading?: true;
}

/**
 * "trang Bug tracker", "the Bug tracker page", "Bug tracker" in quotes name a
 * Page; anything else is a topic to look for in the workspace.
 */
export function namedSourcePage(basedOn: string): string | null {
  const text = basedOn.normalize('NFC').trim();
  const quoted = /^["“'‘`](.+)["”'’`]$/u.exec(text);
  if (quoted) return quoted[1].trim() || null;
  const named =
    /^(?:trang|page)\s+["“'‘`]?(.+?)["”'’`]?$/iu.exec(text) ??
    /^(?:the\s+)?["“'‘`]?(.+?)["”'’`]?\s+page$/iu.exec(text);
  return named ? named[1].trim() || null : null;
}

/**
 * M8: passages of the source the user named, from Pages the user can read
 * in the same workspace, never the target Page itself.
 */
@Injectable()
export class PageSourceReferences {
  private readonly logger = new Logger(PageSourceReferences.name);

  constructor(
    private readonly pageReferenceResolver: PageReferenceResolver,
    @Inject(AI_ASSISTANT_TYPES.ports.PageEmbeddingStore)
    private readonly store: PageEmbeddingStore,
    @Optional() private readonly pageSearch?: PageEmbeddingSearch,
  ) {}

  async collect(
    input: CollectSourceReferencesInput,
  ): Promise<SourceReferences> {
    // I7: a shared Page's visitor reads nothing beyond that Page.
    if (input.shareToken) return { status: 'NOT_FOUND' };
    const title = namedSourcePage(input.basedOn);
    const passages = title
      ? await this.passagesOfPage(input, title)
      : await this.passagesOnTopic(input);
    return passages.length ? withinBudget(passages) : { status: 'NOT_FOUND' };
  }

  /** I3.1: the named Page, read whole in Page order. */
  private async passagesOfPage(
    input: CollectSourceReferencesInput,
    title: string,
  ): Promise<Passage[]> {
    const found = await this.pageReferenceResolver.resolve({
      userId: input.userId,
      workspaceId: input.workspaceId,
      title,
    });
    // Several Pages with the name, or none: nothing is guessed.
    if (found.status !== 'RESOLVED' || found.page.pageId === input.targetPageId)
      return [];
    const page = await this.store.loadSource(found.page.pageId);
    if (!page) return [];
    const passages: Passage[] = [];
    let section: string | undefined;
    for (const block of page.blocks) {
      if (block.type === 'DATABASE_VIEW') continue;
      const text = blockText(block);
      if (!text) continue;
      const base = { pageId: page.pageId, title: page.title, text };
      if (block.type === 'HEADER') {
        section = excerptOf(text, MAX_SECTION_LENGTH);
        passages.push({ ...base, isHeading: true });
      } else {
        passages.push(section ? { ...base, section } : base);
      }
    }
    return passages;
  }

  /** I3.2: the closest blocks of other readable Pages. */
  private async passagesOnTopic(
    input: CollectSourceReferencesInput,
  ): Promise<Passage[]> {
    if (!this.pageSearch) return [];
    try {
      return await this.pageSearch.searchPassages({
        userId: input.userId,
        workspaceId: input.workspaceId,
        query: input.basedOn,
        excludePageId: input.targetPageId,
        limit: MAX_REFERENCES,
        perPage: MAX_REFERENCES_PER_PAGE,
      });
    } catch (error) {
      // No vectors or no AI service: the user is told no source was found.
      this.logger.warn(
        `source_passage_search_failed reason=${error instanceof Error ? error.constructor.name : 'unknown'}`,
      );
      return [];
    }
  }
}

/** I4: at most eight passages of 400 characters, 3000 bytes in all. */
function withinBudget(passages: Passage[]): SourceReferences {
  const references: PlanReference[] = [];
  const sources = new Map<string, PlanSource>();
  let bytes = 0;
  for (const passage of passages) {
    if (references.length === MAX_REFERENCES) break;
    const text = excerptOf(passage.text, MAX_REFERENCE_TEXT_LENGTH);
    const size = Buffer.byteLength(text, 'utf8');
    if (bytes + size > MAX_REFERENCES_BYTES) break;
    bytes += size;
    references.push({
      label: `S${references.length + 1}`,
      pageTitle: passage.title,
      text,
      ...(passage.section ? { section: passage.section } : {}),
      ...(passage.isHeading ? { isHeading: true as const } : {}),
    });
    sources.set(passage.pageId, {
      pageId: passage.pageId,
      title: passage.title,
    });
  }
  return references.length
    ? { status: 'FOUND', references, sources: [...sources.values()] }
    : { status: 'NOT_FOUND' };
}
