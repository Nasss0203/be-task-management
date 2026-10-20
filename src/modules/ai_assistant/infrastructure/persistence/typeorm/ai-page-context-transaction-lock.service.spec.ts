import type { EntityManager } from 'typeorm';
import { AiPageContextTransactionLockService } from './ai-page-context-transaction-lock.service';

describe('AiPageContextTransactionLockService', () => {
  const pageId = 'e75e4e4f-44e5-4c83-8389-19af7b5b3388';
  const service = new AiPageContextTransactionLockService();

  it('requires a live transaction to retain the locks until Confirm commits', async () => {
    const query = jest.fn();
    await expect(
      service.lock(pageId, { query } as unknown as EntityManager),
    ).rejects.toThrow('active transaction');
    expect(query).not.toHaveBeenCalled();
  });

  it('locks Page, blocks, referenced databases and all context descendants in order', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const context = {
      queryRunner: { isTransactionActive: true },
      query,
    } as unknown as EntityManager;

    await service.lock(pageId, context, 'user-1');

    expect(query).toHaveBeenCalledTimes(15);
    const sql = query.mock.calls.map(([statement]: [string]) => statement);
    expect(sql[0]).toContain('FROM pages WHERE id = $1 FOR UPDATE');
    expect(sql[1]).toContain('FROM page_blocks WHERE page_id = $1');
    expect(sql[2]).toContain('FROM databases');
    expect(sql[3]).toContain('FROM database_properties');
    expect(sql[4]).toContain('FROM database_property_options');
    expect(sql[5]).toContain('FROM database_views');
    expect(sql[6]).toContain('FROM database_view_properties');
    expect(sql[7]).toContain('FROM database_rows');
    expect(sql[8]).toContain('FROM database_row_values');
    expect(
      sql.slice(1, 9).every((statement) => statement.includes('FOR UPDATE')),
    ).toBe(true);
    expect(sql[2]).toContain("pb.data_config ->> 'database_id'");
    const calls = query.mock.calls as Array<[string, unknown[]]>;
    expect(calls.every(([, params]) => params[0] === pageId)).toBe(true);
    expect(
      sql.slice(9).every((statement) => statement.includes('FOR SHARE')),
    ).toBe(true);
    expect(sql[9]).toContain('page_shares');
    expect(sql[10]).toContain('WITH RECURSIVE ancestors');
    expect(sql[10]).toContain('page_share_settings');
    expect(sql[12]).toContain('workspace_members');
    expect(sql[13]).toContain('workspace_member_id');
    expect(
      calls
        .slice(9)
        .filter(([statement]) => statement.includes('$2'))
        .every(([, params]) => params[1] === 'user-1'),
    ).toBe(true);
  });

  it('propagates lock failures so UnitOfWork can roll back', async () => {
    const dbError = new Error('deadlock detected');
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(dbError);
    const context = {
      queryRunner: { isTransactionActive: true },
      query,
    } as unknown as EntityManager;
    await expect(service.lock(pageId, context)).rejects.toBe(dbError);
    expect(query).toHaveBeenCalledTimes(2);
  });
});
