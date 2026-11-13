import { ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { TypeOrmTeamspaceOwnershipGuard } from './typeorm-teamspace-ownership.guard';

describe('TypeOrmTeamspaceOwnershipGuard', () => {
  const guard = new TypeOrmTeamspaceOwnershipGuard();

  function managerFor(
    teamspaceIds: string[],
    counts: Record<string, { ownerCount: number; targetOwnerCount: number }>,
  ) {
    const query = jest.fn(async (sql: string, params: unknown[]) => {
      if (sql.includes('FROM workspace_members')) return [{ id: 'member-1' }];
      if (sql.includes('JOIN teamspace_members')) {
        return teamspaceIds.map((id) => ({ id }));
      }
      if (sql.includes('FOR UPDATE')) return [{ id: params[0] }];
      return [counts[params[0] as string]];
    });
    return { query } as unknown as EntityManager & { query: typeof query };
  }

  it('permits a member with no Teamspace ownership', async () => {
    const manager = managerFor([], {});
    await guard.assertCanRemoveWorkspaceMember('ws-1', 'member-1', manager);
    expect(manager.query).toHaveBeenCalledTimes(2);
    expect(manager.query.mock.calls[0][0]).toContain('FOR UPDATE');
  });

  it('rejects the last owner after locking the WorkspaceMember and Teamspace', async () => {
    const manager = managerFor(['teamspace-1'], {
      'teamspace-1': { ownerCount: 1, targetOwnerCount: 1 },
    });
    await expect(
      guard.assertCanRemoveWorkspaceMember('ws-1', 'member-1', manager),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.query.mock.calls[0][0]).toContain('FROM workspace_members');
    expect(manager.query.mock.calls[2][0]).toContain('FOR UPDATE');
    expect(manager.query.mock.calls[3][0]).toContain('COUNT(*)');
  });

  it('permits deletion when another owner remains', async () => {
    const manager = managerFor(['teamspace-1'], {
      'teamspace-1': { ownerCount: 2, targetOwnerCount: 1 },
    });
    await expect(
      guard.assertCanRemoveWorkspaceMember('ws-1', 'member-1', manager),
    ).resolves.toBeUndefined();
  });

  it('locks all Teamspaces in ID order before counting any owner', async () => {
    const manager = managerFor(['teamspace-1', 'teamspace-2'], {
      'teamspace-1': { ownerCount: 2, targetOwnerCount: 1 },
      'teamspace-2': { ownerCount: 1, targetOwnerCount: 1 },
    });
    await expect(
      guard.assertCanRemoveWorkspaceMember('ws-1', 'member-1', manager),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.query.mock.calls.slice(2, 4).map((call) => call[1][0])).toEqual([
      'teamspace-1',
      'teamspace-2',
    ]);
    expect(manager.query.mock.calls[4][0]).toContain('COUNT(*)');
    expect(manager.query.mock.calls[5][0]).toContain('COUNT(*)');
  });

  it('propagates database errors without using another manager', async () => {
    const error = new Error('lock failed');
    const manager = { query: jest.fn().mockRejectedValue(error) } as unknown as EntityManager;
    await expect(
      guard.assertCanRemoveWorkspaceMember('ws-1', 'member-1', manager),
    ).rejects.toBe(error);
  });

  describe('handOverTeamspacesOf', () => {
    type State = { name: string; ownerCount: number; targetOwnerCount: number };

    function handoverManager(
      teamspaceIds: string[],
      states: Record<string, State>,
      successors: Record<
        string,
        { id: string; workspace_member_id: string; user_id: string }
      >,
    ) {
      const rows = (sql: string, params: unknown[]): unknown[] => {
        if (sql.startsWith('UPDATE')) return [];
        if (sql.includes('LIMIT 1')) {
          const successor = successors[params[0] as string];
          return successor ? [successor] : [];
        }
        if (sql.includes('GROUP BY teamspace.id')) {
          return [states[params[0] as string]];
        }
        if (sql.includes('FROM workspace_members')) return [{ id: 'member-1' }];
        if (sql.includes('JOIN teamspace_members')) {
          return teamspaceIds.map((id) => ({ id }));
        }
        return [{ id: params[0] }];
      };
      const query = jest.fn((sql: string, params: unknown[]) =>
        Promise.resolve(rows(sql, params)),
      );
      return { query } as unknown as EntityManager & { query: typeof query };
    }

    const updates = (manager: {
      query: jest.Mock<Promise<unknown[]>, [string, unknown[]]>;
    }) => manager.query.mock.calls.filter(([sql]) => sql.startsWith('UPDATE'));

    it('promotes the earliest remaining member when the target is the last owner', async () => {
      const manager = handoverManager(
        ['ts-1'],
        { 'ts-1': { name: 'Design', ownerCount: 1, targetOwnerCount: 1 } },
        {
          'ts-1': {
            id: 'tm-b',
            workspace_member_id: 'member-b',
            user_id: 'user-b',
          },
        },
      );

      await expect(
        guard.handOverTeamspacesOf('ws-1', 'member-1', 'user-1', manager),
      ).resolves.toEqual([
        {
          teamspaceId: 'ts-1',
          teamspaceName: 'Design',
          newOwnerUserId: 'user-b',
          newOwnerWorkspaceMemberId: 'member-b',
        },
      ]);
      const successorQuery = manager.query.mock.calls.find(([sql]) =>
        sql.includes('LIMIT 1'),
      );
      expect(successorQuery?.[0]).toContain(
        'ORDER BY member.joined_at ASC, member.id ASC',
      );
      expect(updates(manager)).toEqual([
        [
          expect.stringContaining('UPDATE teamspace_members'),
          ['tm-b', 'OWNER'],
        ],
      ]);
    });

    it('archives a Teamspace that would have no member left', async () => {
      const manager = handoverManager(
        ['ts-1'],
        { 'ts-1': { name: 'Solo', ownerCount: 1, targetOwnerCount: 1 } },
        {},
      );

      await expect(
        guard.handOverTeamspacesOf('ws-1', 'member-1', 'user-1', manager),
      ).resolves.toEqual([
        {
          teamspaceId: 'ts-1',
          teamspaceName: 'Solo',
          newOwnerUserId: null,
          newOwnerWorkspaceMemberId: null,
        },
      ]);
      expect(updates(manager)).toEqual([
        [
          expect.stringContaining('SET deleted_at = now(), deleted_by = $2'),
          ['ts-1', 'user-1'],
        ],
      ]);
    });

    it('changes nothing where another owner remains or the target is not an owner', async () => {
      const manager = handoverManager(
        ['ts-1', 'ts-2'],
        {
          'ts-1': { name: 'Shared', ownerCount: 2, targetOwnerCount: 1 },
          'ts-2': { name: 'Joined', ownerCount: 1, targetOwnerCount: 0 },
        },
        {},
      );

      await expect(
        guard.handOverTeamspacesOf('ws-1', 'member-1', 'user-1', manager),
      ).resolves.toEqual([]);
      expect(updates(manager)).toEqual([]);
    });

    it('locks every affected Teamspace before reading any owner', async () => {
      const manager = handoverManager(
        ['ts-1', 'ts-2'],
        {
          'ts-1': { name: 'A', ownerCount: 2, targetOwnerCount: 1 },
          'ts-2': { name: 'B', ownerCount: 2, targetOwnerCount: 1 },
        },
        {},
      );

      await guard.handOverTeamspacesOf('ws-1', 'member-1', 'user-1', manager);

      const sqls = manager.query.mock.calls.map(([sql]) => sql);
      const lastLock = sqls
        .map((sql) => sql.includes('FROM teamspaces WHERE id = $1 FOR UPDATE'))
        .lastIndexOf(true);
      const firstRead = sqls.findIndex((sql) =>
        sql.includes('GROUP BY teamspace.id'),
      );
      expect(lastLock).toBeGreaterThan(-1);
      expect(lastLock).toBeLessThan(firstRead);
    });
  });
});
