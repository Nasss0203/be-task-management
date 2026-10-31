import { createHash } from 'node:crypto';

import type {
  EmbeddingResourceType,
  PageEmbeddingSource,
  PageEmbeddingSourceBlock,
} from './page-embedding.port';

// M5 (F4): the Page row is its title and headers; each block with text gets
// its own rows, split into pieces the embedding model reads whole.
export const PAGE_TEXT_LIMIT = 1000;
export const BLOCK_CHUNK_LIMIT = 1500;
export const EXCERPT_LIMIT = 160;

export interface PageEmbeddingChunk {
  resourceType: EmbeddingResourceType;
  blockId: string | null;
  chunkIndex: number;
  text: string;
  contentHash: string;
}

export function chunkKey(chunk: {
  resourceType: EmbeddingResourceType;
  blockId: string | null;
  chunkIndex: number;
}): string {
  return `${chunk.resourceType}:${chunk.blockId ?? ''}:${chunk.chunkIndex}`;
}

export function buildPageEmbeddingChunks(
  source: PageEmbeddingSource,
): PageEmbeddingChunk[] {
  const chunks: PageEmbeddingChunk[] = [];
  const headers = source.blocks
    .filter((block) => block.type === 'HEADER')
    .map(blockText);
  const pageText = joinParts([source.title, ...headers]).slice(
    0,
    PAGE_TEXT_LIMIT,
  );
  if (pageText) chunks.push(chunk('PAGE', null, 0, pageText.trimEnd()));

  for (const block of source.blocks) {
    // A database view's rows are not Page text (M5 embeds no rows).
    if (block.type === 'DATABASE_VIEW') continue;
    splitText(blockText(block)).forEach((text, index) =>
      chunks.push(chunk('BLOCK', block.id, index, text)),
    );
  }
  return chunks;
}

export function blockText(block: PageEmbeddingSourceBlock): string {
  const content =
    block.content && typeof block.content === 'object'
      ? (block.content as Record<string, unknown>)
      : {};
  return joinParts([block.title, content.text, content.caption]);
}

function joinParts(parts: unknown[]): string {
  return parts
    .filter((part): part is string => typeof part === 'string')
    .map(normalize)
    .filter(Boolean)
    .join('\n');
}

function normalize(text: string): string {
  return text.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

/** M7 (H3): at most `limit` characters, cut between words. */
export function excerptOf(text: string, limit = EXCERPT_LIMIT): string {
  const flat = text.replace(/\s+/gu, ' ').trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > limit / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Pieces of at most BLOCK_CHUNK_LIMIT, cut after a sentence when possible. */
export function splitText(text: string): string[] {
  if (text.length <= BLOCK_CHUNK_LIMIT) return text ? [text] : [];
  const pieces: string[] = [];
  let current = '';
  for (const sentence of text.split(/(?<=[.!?…])\s+|\n/u)) {
    const joined = current ? `${current} ${sentence}` : sentence;
    if (joined.length <= BLOCK_CHUNK_LIMIT) {
      current = joined;
      continue;
    }
    if (current) pieces.push(current);
    current = sentence;
    while (current.length > BLOCK_CHUNK_LIMIT) {
      pieces.push(current.slice(0, BLOCK_CHUNK_LIMIT));
      current = current.slice(BLOCK_CHUNK_LIMIT).trimStart();
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

function chunk(
  resourceType: EmbeddingResourceType,
  blockId: string | null,
  chunkIndex: number,
  text: string,
): PageEmbeddingChunk {
  return {
    resourceType,
    blockId,
    chunkIndex,
    text,
    contentHash: createHash('sha256').update(text).digest('hex'),
  };
}

/** Texts grouped so each group fits one request to the AI service. */
export function embeddingBatches<T extends { text: string }>(
  items: T[],
  maxTexts: number,
  maxTotalLength: number,
): T[][] {
  const batches: T[][] = [];
  let batch: T[] = [];
  let length = 0;
  for (const item of items) {
    if (
      batch.length === maxTexts ||
      (batch.length > 0 && length + item.text.length > maxTotalLength)
    ) {
      batches.push(batch);
      batch = [];
      length = 0;
    }
    batch.push(item);
    length += item.text.length;
  }
  if (batch.length) batches.push(batch);
  return batches;
}
