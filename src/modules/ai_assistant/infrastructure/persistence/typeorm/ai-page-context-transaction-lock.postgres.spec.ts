import { randomUUID } from 'node:crypto';
import dataSource from 'src/database/data-source';
import type { QueryRunner } from 'typeorm';
import { AiPageContextTransactionLockService } from './ai-page-context-transaction-lock.service';

/**
 * Opt-in PostgreSQL integration test against ONLY the Phase 5 disposable Page.
 * Every trial write is rolled back; the fixture's contents are never changed.
 *
 * RUN_AI_PAGE_LOCK_PG_E2E=1 npx jest ai-page-context-transaction-lock.postgres --runInBand
 */
const describePostgres =
  process.env.RUN_AI_PAGE_LOCK_PG_E2E === '1' ? describe : describe.skip;

describePostgres('AI Page Context PostgreSQL row-lock integration', () => {
  const pageId = '027228db-8fcb-437e-b6c1-eb276fb44ffe';
  const service = new AiPageContextTransactionLockService();
  let holder: QueryRunner;
  let writer: QueryRunner;
  let block: { id: string; type: string; created_by: string };

  beforeAll(async () => {
    await dataSource.initialize();
    holder = dataSource.createQueryRunner();
    writer = dataSource.createQueryRunner();
    await Promise.all([holder.connect(), writer.connect()]);
    const blocks = (await holder.query(
      'SELECT id, type, created_by FROM page_blocks WHERE page_id = $1 AND deleted_at IS NULL ORDER BY id LIMIT 1',
      [pageId],
    )) as (typeof block)[];
    if (blocks.length !== 1) {
      throw new Error(
        'Missing the dedicated Phase 5 disposable Page block fixture',
      );
    }
    block = blocks[0];
  });

  afterAll(async () => {
    if (writer?.isTransactionActive) await writer.rollbackTransaction();
    if (holder?.isTransactionActive) await holder.rollbackTransaction();
    if (writer) await writer.release();
    if (holder) await holder.release();
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  async function expectWriteBlocked(sql: string, params: unknown[]) {
    await writer.startTransaction();
    try {
      await writer.query("SET LOCAL lock_timeout = '300ms'");
      await expect(writer.query(sql, params)).rejects.toMatchObject({
        code: '55P03',
      });
    } finally {
      await writer.rollbackTransaction();
    }
  }

  it('blocks ordinary Page update, existing block update and new block insert', async () => {
    await holder.startTransaction();
    try {
      await service.lock(pageId, holder.manager, block.created_by);

      await expectWriteBlocked('UPDATE pages SET title = title WHERE id = $1', [
        pageId,
      ]);
      await expectWriteBlocked(
        'UPDATE page_blocks SET title = title WHERE id = $1',
        [block.id],
      );
      await expectWriteBlocked(
        'INSERT INTO page_blocks (id, page_id, type, order_index, created_by) VALUES ($1, $2, $3, $4, $5)',
        [randomUUID(), pageId, block.type, 10000000, block.created_by],
      );
    } finally {
      await holder.rollbackTransaction();
    }

    // Confirm released its lock. A normal writer can now proceed and roll back.
    await writer.startTransaction();
    try {
      await writer.query("SET LOCAL lock_timeout = '300ms'");
      await writer.query('UPDATE page_blocks SET title = title WHERE id = $1', [
        block.id,
      ]);
    } finally {
      await writer.rollbackTransaction();
    }
  });

  it('waits for an in-flight existing-block edit before reading the Page context', async () => {
    await writer.startTransaction();
    await writer.query('UPDATE page_blocks SET title = title WHERE id = $1', [
      block.id,
    ]);

    await holder.startTransaction();
    let lockCompleted = false;
    const pending = service.lock(pageId, holder.manager, block.created_by).then(() => {
      lockCompleted = true;
    });

    try {
      // Page itself is not updated by this writer; the child row must still
      // block context locking, not only Page metadata or block INSERT.
      await new Promise((resolve) => setTimeout(resolve, 120));
      expect(lockCompleted).toBe(false);
    } finally {
      await writer.rollbackTransaction();
      await pending;
      await holder.rollbackTransaction();
    }
    expect(lockCompleted).toBe(true);
  });
});
