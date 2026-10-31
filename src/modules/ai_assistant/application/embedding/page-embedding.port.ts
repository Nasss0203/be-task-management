/**
 * M5 (kế hoạch hạ tầng vector): Page text is turned into vectors by the AI
 * service and kept in PostgreSQL (`real[]`, F1). Search reads the vectors of
 * one workspace and checks access afterwards (F7).
 */

/** A search sentence or a piece of Page text (the AI service adds the query instruction). */
export type EmbeddingKind = 'query' | 'document';

// The AI service's limits for one request (F6).
export const MAX_EMBEDDING_TEXTS = 32;
export const MAX_EMBEDDING_TEXT_LENGTH = 2000;
export const MAX_EMBEDDING_TOTAL_LENGTH = 16000;

// F1: past this, reading every vector of a workspace gets slow; move to pgvector.
export const VECTORS_PER_WORKSPACE_WARNING = 20_000;

export interface EmbeddingBatch {
  model: string;
  dimensions: number;
  /** One unit-length vector per text, in order. */
  embeddings: number[][];
}

export interface TextEmbedder {
  embed(kind: EmbeddingKind, texts: string[]): Promise<EmbeddingBatch>;
}

export type EmbeddingResourceType = 'PAGE' | 'BLOCK';

export interface PageEmbeddingSourceBlock {
  id: string;
  type: string;
  title: string | null;
  content: unknown;
}

export interface PageEmbeddingSource {
  pageId: string;
  workspaceId: string;
  title: string;
  /** Blocks in Page order, without deleted ones. */
  blocks: PageEmbeddingSourceBlock[];
  /** Database time the Page was read at; edits after it index the Page again. */
  readAt: string;
}

export interface StoredPageEmbedding {
  id: string;
  resourceType: EmbeddingResourceType;
  blockId: string | null;
  chunkIndex: number;
  contentHash: string;
  model: string;
}

export interface NewPageEmbedding {
  resourceType: EmbeddingResourceType;
  blockId: string | null;
  chunkIndex: number;
  contentHash: string;
  model: string;
  dimensions: number;
  embedding: number[];
}

export interface SavePageEmbeddings {
  pageId: string;
  workspaceId: string;
  readAt: string;
  model: string;
  /** Rows still right; every other row of the Page is removed. */
  keepIds: string[];
  added: NewPageEmbedding[];
}

export interface WorkspaceVector {
  pageId: string;
  blockId: string | null;
  resourceType: EmbeddingResourceType;
  embedding: number[];
}

export interface PageEmbeddingStore {
  /** Runs `work` while no other process indexes; null when one already does. */
  withIndexLock<T>(work: () => Promise<T>): Promise<T | null>;
  /** Live Pages never indexed, edited since, or indexed with another model. */
  findPagesToIndex(model: string, limit: number): Promise<string[]>;
  /** Pages in the Trash that still have vectors. */
  findTrashedIndexedPages(limit: number): Promise<string[]>;
  /** Null when the Page is gone or in the Trash. */
  loadSource(pageId: string): Promise<PageEmbeddingSource | null>;
  findStored(pageId: string): Promise<StoredPageEmbedding[]>;
  savePage(save: SavePageEmbeddings): Promise<void>;
  removePage(pageId: string): Promise<void>;
  /** M7 (H3): a live block of that Page, read again for an excerpt. */
  loadBlock(
    pageId: string,
    blockId: string,
  ): Promise<PageEmbeddingSourceBlock | null>;
  findWorkspaceVectors(
    workspaceId: string,
    model: string,
    resourceType?: EmbeddingResourceType,
  ): Promise<WorkspaceVector[]>;
}
