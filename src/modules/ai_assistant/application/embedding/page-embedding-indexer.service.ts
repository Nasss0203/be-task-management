import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import {
  buildPageEmbeddingChunks,
  chunkKey,
  embeddingBatches,
  type PageEmbeddingChunk,
} from './page-embedding-chunks';
import {
  MAX_EMBEDDING_TEXTS,
  MAX_EMBEDDING_TOTAL_LENGTH,
  type NewPageEmbedding,
  type PageEmbeddingStore,
  type TextEmbedder,
} from './page-embedding.port';

export const PAGES_PER_RUN = 20;
const DEFAULT_INTERVAL_MS = 30_000;

export interface PageIndexRun {
  removed: number;
  indexed: number;
  embedded: number;
}

/**
 * M5 (F5): every 30 seconds, Pages edited since they were last indexed get
 * their vectors made again, only for text whose hash changed. No handler has
 * to remember to call it, and a missed run is caught up by the next one.
 * Off unless AI_EMBEDDING_INDEXER_ENABLED=true.
 */
@Injectable()
export class PageEmbeddingIndexer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PageEmbeddingIndexer.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  /** The AI service's model, learnt from its replies. */
  private model: string | null = null;

  constructor(
    @Inject(AI_ASSISTANT_TYPES.ports.PageEmbeddingStore)
    private readonly store: PageEmbeddingStore,
    @Inject(AI_ASSISTANT_TYPES.ports.TextEmbedder)
    private readonly embedder: TextEmbedder,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    if (
      this.configService.get<string>('AI_EMBEDDING_INDEXER_ENABLED') !== 'true'
    )
      return;
    const interval = Number(
      this.configService.get<string>('AI_EMBEDDING_INDEXER_INTERVAL_MS') ??
        DEFAULT_INTERVAL_MS,
    );
    this.timer = setInterval(() => void this.tick(), interval);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const run = await this.runOnce();
      if (run && (run.removed || run.embedded))
        this.logger.log(
          `page_index_run removed=${run.removed} indexed=${run.indexed} embedded=${run.embedded}`,
        );
    } catch (error) {
      // The AI service may be down: editing Pages goes on, the next run retries.
      this.logger.warn(
        `page_index_run_failed reason=${error instanceof Error ? error.constructor.name : 'unknown'}`,
      );
    } finally {
      this.running = false;
    }
  }

  /** One pass; null when another process is indexing. */
  async runOnce(): Promise<PageIndexRun | null> {
    return this.store.withIndexLock(async () => {
      const run: PageIndexRun = { removed: 0, indexed: 0, embedded: 0 };
      for (const pageId of await this.store.findTrashedIndexedPages(
        PAGES_PER_RUN,
      )) {
        await this.store.removePage(pageId);
        run.removed++;
      }

      const model = this.model ?? (await this.learnModel());
      for (const pageId of await this.store.findPagesToIndex(
        model,
        PAGES_PER_RUN,
      )) {
        const embedded = await this.indexPage(pageId, model);
        if (embedded === null) break; // the model changed: start over next run
        run.indexed++;
        run.embedded += embedded;
      }
      return run;
    });
  }

  /** Vectors made for the Page, or null when the AI service changed model. */
  private async indexPage(
    pageId: string,
    model: string,
  ): Promise<number | null> {
    const source = await this.store.loadSource(pageId);
    if (!source) return 0;

    const stored = new Map(
      (await this.store.findStored(pageId)).map((row) => [chunkKey(row), row]),
    );
    const keepIds: string[] = [];
    const changed: PageEmbeddingChunk[] = [];
    for (const chunk of buildPageEmbeddingChunks(source)) {
      const row = stored.get(chunkKey(chunk));
      if (row && row.contentHash === chunk.contentHash && row.model === model)
        keepIds.push(row.id);
      else changed.push(chunk);
    }

    const added: NewPageEmbedding[] = [];
    for (const batch of embeddingBatches(
      changed,
      MAX_EMBEDDING_TEXTS,
      MAX_EMBEDDING_TOTAL_LENGTH,
    )) {
      const result = await this.embedder.embed(
        'document',
        batch.map((chunk) => chunk.text),
      );
      if (result.model !== model) {
        this.model = result.model;
        return null;
      }
      batch.forEach((chunk, index) =>
        added.push({
          resourceType: chunk.resourceType,
          blockId: chunk.blockId,
          chunkIndex: chunk.chunkIndex,
          contentHash: chunk.contentHash,
          model,
          dimensions: result.dimensions,
          embedding: result.embeddings[index],
        }),
      );
    }

    await this.store.savePage({
      pageId,
      workspaceId: source.workspaceId,
      readAt: source.readAt,
      model,
      keepIds,
      added,
    });
    return added.length;
  }

  private async learnModel(): Promise<string> {
    const { model } = await this.embedder.embed('document', ['Taskmanly']);
    this.model = model;
    return model;
  }
}
