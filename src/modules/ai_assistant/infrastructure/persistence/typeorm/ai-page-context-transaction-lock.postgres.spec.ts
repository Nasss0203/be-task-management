import { randomUUID } from 'node:crypto';
import { AiPageContextTransactionLockService } from './ai-page-context-transaction-lock.service';
import {
  AiPageLockPostgresFixture,
  describePostgres,
} from './ai-page-lock-postgres.fixture';

describePostgres('AI Page context PostgreSQL row locks', () => {
  const fixture = new AiPageLockPostgresFixture();
  const service = new AiPageContextTransactionLockService();
  beforeAll(async () => fixture.initialize());
  beforeEach(async () => fixture.reset());
  afterAll(async () => fixture.destroy());

  it('blocks ordinary Page/block edits and FK-backed block INSERT, then releases locks', async () => {
    await fixture.holder.startTransaction();
    await service.lock(fixture.pageId, fixture.holder.manager, fixture.userId);
    await fixture.expectBlocked((writer) =>
      writer.query('UPDATE pages SET title=title WHERE id=$1', [
        fixture.pageId,
      ]),
    );
    await fixture.expectBlocked((writer) =>
      writer.query('UPDATE page_blocks SET title=title WHERE id=$1', [
        fixture.blockId,
      ]),
    );
    await fixture.expectBlocked((writer) =>
      writer.query('INSERT INTO page_blocks(id,page_id) VALUES ($1,$2)', [
        randomUUID(),
        fixture.pageId,
      ]),
    );
    await fixture.holder.rollbackTransaction();
    await fixture.writer.startTransaction();
    await fixture.writer.query("SET LOCAL lock_timeout = '200ms'");
    await fixture.writer.query(
      'UPDATE page_blocks SET title=title WHERE id=$1',
      [fixture.blockId],
    );
    await fixture.writer.rollbackTransaction();
  });

  it('waits for existing block edits before reading the fingerprint', async () => {
    await fixture.writer.startTransaction();
    await fixture.writer.query(
      'UPDATE page_blocks SET title=title WHERE id=$1',
      [fixture.blockId],
    );
    await fixture.holder.startTransaction();
    const pending = service.lock(
      fixture.pageId,
      fixture.holder.manager,
      fixture.userId,
    );
    try {
      await fixture.waitForBlockedWriter();
    } finally {
      await fixture.writer.rollbackTransaction();
      await pending;
      await fixture.holder.rollbackTransaction();
    }
  });

  it('holds hierarchy stable, including ancestors that have no permission row yet', async () => {
    await fixture.holder.startTransaction();
    await service.lock(fixture.pageId, fixture.holder.manager, fixture.userId);
    await fixture.expectBlocked((writer) =>
      writer.query('UPDATE pages SET parent_page_id=$1 WHERE id=$2', [
        fixture.unrelatedId,
        fixture.ancestorId,
      ]),
    );
    await fixture.expectBlocked((writer) =>
      writer.query('UPDATE pages SET deleted_at=now() WHERE id=$1', [
        fixture.rootId,
      ]),
    );
    await fixture.holder.rollbackTransaction();
  });

  it('serializes overlapping ancestor/descendant Confirms without a lock upgrade deadlock', async () => {
    await fixture.holder.startTransaction();
    await service.lock(fixture.pageId, fixture.holder.manager, fixture.userId);
    await fixture.writer.startTransaction();
    const pending = service.lock(
      fixture.ancestorId,
      fixture.writer.manager,
      fixture.userId,
    );
    const [{ pid }] = await fixture.holder.manager.query<{ pid: number }[]>(
      'SELECT pg_backend_pid() AS pid',
    );
    let blocked = false;
    try {
      const deadline = Date.now() + 1500;
      while (Date.now() < deadline) {
        const rows = await fixture.source.query<{ pid: number }[]>(
          'SELECT pid FROM pg_stat_activity WHERE $1=ANY(pg_blocking_pids(pid))',
          [pid],
        );
        if (rows.length) {
          blocked = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(blocked).toBe(true);
    } finally {
      await fixture.holder.rollbackTransaction();
      await pending;
      await fixture.writer.rollbackTransaction();
    }
  });

  it('allows sibling Confirms in parallel while sharing only ancestor locks', async () => {
    const sibling = randomUUID();
    await fixture.source.query(
      `INSERT INTO pages(id,parent_page_id,workspace_id,teamspace_id,title,created_by)
      VALUES ($1,$2,$3,$4,'Sibling fixture',$5)`,
      [
        sibling,
        fixture.ancestorId,
        fixture.workspaceId,
        fixture.teamspaceId,
        fixture.creatorId,
      ],
    );
    await fixture.holder.startTransaction();
    await service.lock(fixture.pageId, fixture.holder.manager, fixture.userId);
    await fixture.writer.startTransaction();
    await fixture.writer.query("SET LOCAL lock_timeout = '200ms'");
    await service.lock(sibling, fixture.writer.manager, fixture.userId);
    await fixture.writer.rollbackTransaction();
    await fixture.holder.rollbackTransaction();
  });
});
