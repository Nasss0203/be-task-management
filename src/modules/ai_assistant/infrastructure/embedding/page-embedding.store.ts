import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  EmbeddingResourceType,
  PageEmbeddingSource,
  PageEmbeddingSourceBlock,
  PageEmbeddingStore,
  SavePageEmbeddings,
  StoredPageEmbedding,
  WorkspaceVector,
} from '../../application/embedding/page-embedding.port';

/**
 * M5 (F1, F5): vectors as `real[]` in PostgreSQL (no pgvector on this
 * server). The indexer holds a session advisory lock so only one process
 * indexes at a time.
 */
@Injectable()
export class PageEmbeddingSqlStore implements PageEmbeddingStore {
  constructor(private readonly dataSource: DataSource) {}

  async withIndexLock<T>(work: () => Promise<T>): Promise<T | null> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      const [{ locked }] = (await runner.query(
        `SELECT pg_try_advisory_lock(hashtext('taskmanly:page-embedding-indexer')) AS locked`,
      )) as { locked: boolean }[];
      if (!locked) return null;
      try {
        return await work();
      } finally {
        await runner.query(
          `SELECT pg_advisory_unlock(hashtext('taskmanly:page-embedding-indexer'))`,
        );
      }
    } finally {
      await runner.release();
    }
  }

  async findPagesToIndex(model: string, limit: number): Promise<string[]> {
    // greatest() skips NULL: a block counts by its last edit or deletion.
    const rows = await this.dataSource.query<{ id: string }[]>(
      `SELECT p.id
       FROM pages p
       LEFT JOIN page_index_state s ON s.page_id = p.id
       WHERE p.deleted_at IS NULL
         AND (
           s.page_id IS NULL
           OR s.model <> $1
           OR p.updated_at > s.indexed_at
           OR EXISTS (
             SELECT 1 FROM page_blocks b
             WHERE b.page_id = p.id
               AND greatest(b.updated_at, b.deleted_at) > s.indexed_at
           )
         )
       ORDER BY p.updated_at DESC
       LIMIT $2`,
      [model, limit],
    );
    return rows.map((row) => row.id);
  }

  async findTrashedIndexedPages(limit: number): Promise<string[]> {
    const rows = await this.dataSource.query<{ page_id: string }[]>(
      `SELECT s.page_id
       FROM page_index_state s
       JOIN pages p ON p.id = s.page_id
       WHERE p.deleted_at IS NOT NULL
       LIMIT $1`,
      [limit],
    );
    return rows.map((row) => row.page_id);
  }

  async loadSource(pageId: string): Promise<PageEmbeddingSource | null> {
    // read_at is a minute early: an edit whose transaction began before this
    // read but committed after it still has a later updated_at, and the hash
    // keeps the extra pass cheap. Kept as text so no zone is applied to it.
    const [page] = await this.dataSource.query<
      {
        id: string;
        workspace_id: string;
        title: string | null;
        read_at: string;
      }[]
    >(
      `SELECT id, workspace_id, title,
              (localtimestamp - interval '1 minute')::text AS read_at
       FROM pages
       WHERE id = $1 AND deleted_at IS NULL`,
      [pageId],
    );
    if (!page) return null;
    const blocks = await this.dataSource.query<
      { id: string; type: string; title: string | null; content: unknown }[]
    >(
      `SELECT id, type::text AS type, title, content
       FROM page_blocks
       WHERE page_id = $1 AND deleted_at IS NULL
       ORDER BY order_index, id`,
      [pageId],
    );
    return {
      pageId: page.id,
      workspaceId: page.workspace_id,
      title: page.title ?? '',
      blocks,
      readAt: page.read_at,
    };
  }

  async findStored(pageId: string): Promise<StoredPageEmbedding[]> {
    const rows = await this.dataSource.query<
      {
        id: string;
        resource_type: EmbeddingResourceType;
        block_id: string | null;
        chunk_index: number;
        content_hash: string;
        model: string;
      }[]
    >(
      `SELECT id, resource_type, block_id, chunk_index, content_hash, model
       FROM page_embeddings
       WHERE page_id = $1`,
      [pageId],
    );
    return rows.map((row) => ({
      id: row.id,
      resourceType: row.resource_type,
      blockId: row.block_id,
      chunkIndex: row.chunk_index,
      contentHash: row.content_hash,
      model: row.model,
    }));
  }

  async savePage(save: SavePageEmbeddings): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM page_embeddings
         WHERE page_id = $1 AND NOT (id = ANY($2::uuid[]))`,
        [save.pageId, save.keepIds],
      );
      await manager.query(
        `UPDATE page_embeddings SET workspace_id = $2
         WHERE page_id = $1 AND workspace_id <> $2`,
        [save.pageId, save.workspaceId],
      );
      for (const row of save.added) {
        await manager.query(
          `INSERT INTO page_embeddings
             (workspace_id, page_id, block_id, resource_type, chunk_index,
              content_hash, model, dimensions, embedding)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::real[])`,
          [
            save.workspaceId,
            save.pageId,
            row.blockId,
            row.resourceType,
            row.chunkIndex,
            row.contentHash,
            row.model,
            row.dimensions,
            row.embedding,
          ],
        );
      }
      await manager.query(
        `INSERT INTO page_index_state (page_id, indexed_at, model)
         VALUES ($1, $2::timestamp, $3)
         ON CONFLICT (page_id)
         DO UPDATE SET indexed_at = EXCLUDED.indexed_at, model = EXCLUDED.model`,
        [save.pageId, save.readAt, save.model],
      );
    });
  }

  async removePage(pageId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`DELETE FROM page_embeddings WHERE page_id = $1`, [
        pageId,
      ]);
      await manager.query(`DELETE FROM page_index_state WHERE page_id = $1`, [
        pageId,
      ]);
    });
  }

  async loadBlock(
    pageId: string,
    blockId: string,
  ): Promise<PageEmbeddingSourceBlock | null> {
    // The block must still belong to that Page: a vector may be older.
    const [block] = await this.dataSource.query<PageEmbeddingSourceBlock[]>(
      `SELECT id, type::text AS type, title, content
       FROM page_blocks
       WHERE id = $1 AND page_id = $2 AND deleted_at IS NULL`,
      [blockId, pageId],
    );
    return block ?? null;
  }

  async findWorkspaceVectors(
    workspaceId: string,
    model: string,
    resourceType?: EmbeddingResourceType,
  ): Promise<WorkspaceVector[]> {
    const rows = await this.dataSource.query<
      {
        page_id: string;
        block_id: string | null;
        resource_type: EmbeddingResourceType;
        embedding: number[];
      }[]
    >(
      `SELECT e.page_id, e.block_id, e.resource_type, e.embedding
       FROM page_embeddings e
       JOIN pages p ON p.id = e.page_id
       WHERE e.workspace_id = $1 AND e.model = $2
         AND ($3::varchar IS NULL OR e.resource_type = $3)
         AND p.deleted_at IS NULL`,
      [workspaceId, model, resourceType ?? null],
    );
    return rows.map((row) => ({
      pageId: row.page_id,
      blockId: row.block_id,
      resourceType: row.resource_type,
      embedding: row.embedding,
    }));
  }
}
