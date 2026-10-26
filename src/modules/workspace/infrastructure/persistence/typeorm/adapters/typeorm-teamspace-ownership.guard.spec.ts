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
});
