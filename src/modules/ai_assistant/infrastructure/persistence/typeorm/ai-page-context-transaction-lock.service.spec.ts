import type { EntityManager } from 'typeorm';
import { AiPageContextTransactionLockService } from './ai-page-context-transaction-lock.service';

describe('AiPageContextTransactionLockService', () => {
  const pageId = 'e75e4e4f-44e5-4c83-8389-19af7b5b3388';
  const service = new AiPageContextTransactionLockService();

  it('requires a live transaction to retain the locks until Confirm commits', async () => {
    const query = jest.fn();
    await expect(
      service.lock(pageId, { query } as unknown as EntityManager, 'user-1'),
    ).rejects.toThrow('active transaction');
    expect(query).not.toHaveBeenCalled();
  });

  it('locks ancestors root-first without upgrading a target SHARE lock, then locks context and permissions', async () => {
    const ancestors = [
      { id: 'root', parent_page_id: null },
      { id: 'parent', parent_page_id: 'root' },
      { id: pageId, parent_page_id: 'parent' },
    ];
    const query = jest.fn((statement: string, params: string[]) =>
      Promise.resolve(
        statement.includes('ARRAY[id]') ? ancestors : [{ id: params[0] }],
      ),
    );
    const context = {
      queryRunner: { isTransactionActive: true },
      query,
    } as unknown as EntityManager;
    await service.lock(pageId, context, 'user-1');
    expect(query).toHaveBeenCalledTimes(19);
    const calls = query.mock.calls;
    expect(calls[1][0]).toContain('FOR SHARE');
    expect(calls[1][1]).toEqual(['root']);
    expect(calls[2][0]).toContain('FOR SHARE');
    expect(calls[2][1]).toEqual(['parent']);
    expect(calls[3][0]).toContain('FOR UPDATE');
    expect(calls[3][1]).toEqual([pageId]);
    expect(calls[4][0]).toContain('WITH RECURSIVE ancestors');
    const sql = calls.slice(5).map(([statement]) => statement);
    expect(sql[0]).toContain('FROM page_blocks WHERE page_id = $1');
    expect(sql[1]).toContain("pb.data_config ->> 'database_id'");
    expect(sql[2]).toContain('FROM database_properties');
    expect(sql[3]).toContain('FROM database_property_options');
    expect(sql[4]).toContain('FROM database_views');
    expect(sql[5]).toContain('FROM database_view_properties');
    expect(sql[6]).toContain('FROM database_rows');
    expect(sql[7]).toContain('FROM database_row_values');
    expect(
      sql.slice(0, 8).every((statement) => statement.includes('FOR UPDATE')),
    ).toBe(true);
    expect(
      sql.slice(8).every((statement) => statement.includes('FOR SHARE')),
    ).toBe(true);
    expect(sql[8]).toContain('page_shares');
    expect(sql[9]).toContain('page_share_settings');
    expect(sql[11]).toContain('workspace_members');
    expect(sql[12]).toContain('workspace_member_id');
    expect(calls.slice(5).every(([, params]) => params[0] === pageId)).toBe(
      true,
    );
    expect(
      calls
        .filter(([statement]) => statement.includes('$2'))
        .every(([, params]) => params[1] === 'user-1'),
    ).toBe(true);
  });

  it('propagates lock failures so UnitOfWork can roll back', async () => {
    const dbError = new Error('deadlock detected');
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: pageId, parent_page_id: null }])
      .mockRejectedValueOnce(dbError);
    const context = {
      queryRunner: { isTransactionActive: true },
      query,
    } as unknown as EntityManager;
    await expect(service.lock(pageId, context, 'user-1')).rejects.toBe(dbError);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('fails closed when the ancestor chain changed while locks were being acquired', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: pageId, parent_page_id: null }])
      .mockResolvedValueOnce([{ id: pageId }])
      .mockResolvedValueOnce([{ id: pageId, parent_page_id: 'replacement' }]);
    const context = {
      queryRunner: { isTransactionActive: true },
      query,
    } as unknown as EntityManager;
    await expect(service.lock(pageId, context, 'user-1')).rejects.toMatchObject(
      { status: 409 },
    );
    expect(query).toHaveBeenCalledTimes(3);
  });

  it('rejects incomplete or cyclic ancestry before any mutation', async () => {
    const query = jest
      .fn()
      .mockResolvedValue([{ id: pageId, parent_page_id: 'missing-or-cycle' }]);
    const context = {
      queryRunner: { isTransactionActive: true },
      query,
    } as unknown as EntityManager;
    await expect(service.lock(pageId, context, 'user-1')).rejects.toMatchObject(
      { status: 409 },
    );
    expect(query).toHaveBeenCalledTimes(1);
  });
});
