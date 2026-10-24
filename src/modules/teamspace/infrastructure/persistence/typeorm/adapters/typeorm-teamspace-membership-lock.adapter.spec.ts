import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TypeOrmTeamspaceMembershipLock } from './typeorm-teamspace-membership-lock.adapter';

/** Typed stand-in for EntityManager.query: each call is [sql, params]. */
const queryMock = () => jest.fn<Promise<unknown[]>, [string, unknown[]?]>();

describe('TypeOrmTeamspaceMembershipLock', () => {
  const adapter = new TypeOrmTeamspaceMembershipLock();

  it('locks WorkspaceMembers in order, then the Workspace, then the Teamspace on the supplied manager', async () => {
    const query = queryMock()
      .mockResolvedValueOnce([{ workspace_id: 'workspace' }])
      .mockResolvedValueOnce([{ id: 'actor' }])
      .mockResolvedValueOnce([{ id: 'actor' }])
      .mockResolvedValueOnce([{ id: 'target' }])
      .mockResolvedValueOnce([{ id: 'actor' }])
      .mockResolvedValueOnce([{ id: 'workspace' }])
      .mockResolvedValueOnce([{ id: 'teamspace' }]);
    const manager = { query, queryRunner: { isTransactionActive: true } };

    await adapter.lockForMembershipChange(
      'target',
      'teamspace',
      'user',
      manager,
    );

    expect(query).toHaveBeenCalledTimes(7);
    expect(query.mock.calls[2][0]).toContain('FOR UPDATE');
    expect(query.mock.calls[2][1]).toEqual(['actor', 'workspace']);
    expect(query.mock.calls[3][1]).toEqual(['target', 'workspace']);
    expect(query.mock.calls[4][1]).toEqual(['workspace', 'user']);
    // A soft-deleted Workspace must not accept membership changes (TS-1.6).
    expect(query.mock.calls[5][0]).toContain('FROM workspaces');
    expect(query.mock.calls[5][0]).toContain('deleted_at IS NULL');
    expect(query.mock.calls[5][0]).toContain('FOR SHARE');
    expect(query.mock.calls[5][1]).toEqual(['workspace']);
    expect(query.mock.calls[6][0]).toContain('FROM teamspaces');
    expect(query.mock.calls[6][0]).toContain('FOR UPDATE');
  });

  it('stops before locking the Teamspace when its Workspace was soft-deleted', async () => {
    const query = queryMock()
      .mockResolvedValueOnce([{ workspace_id: 'workspace' }])
      .mockResolvedValueOnce([{ id: 'actor' }])
      .mockResolvedValueOnce([{ id: 'actor' }])
      .mockResolvedValueOnce([{ id: 'target' }])
      .mockResolvedValueOnce([{ id: 'actor' }])
      .mockResolvedValueOnce([]);

    await expect(
      adapter.lockForMembershipChange('target', 'teamspace', 'user', {
        query,
        queryRunner: { isTransactionActive: true },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(query).toHaveBeenCalledTimes(6);
  });

  it.each([
    ['removed', []],
    ['re-created', [{ id: 'replacement' }]],
  ])(
    'rejects an actor whose membership was %s while waiting',
    async (_state, currentActor) => {
      const query = queryMock()
        .mockResolvedValueOnce([{ workspace_id: 'workspace' }])
        .mockResolvedValueOnce([{ id: 'actor' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'target' }])
        .mockResolvedValueOnce(currentActor);
      await expect(
        adapter.lockForMembershipChange('target', 'teamspace', 'user', {
          query,
          queryRunner: { isTransactionActive: true },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(query).toHaveBeenCalledTimes(5);
    },
  );

  it('requires a transaction and an existing target WorkspaceMember', async () => {
    const query = queryMock()
      .mockResolvedValueOnce([{ workspace_id: 'workspace' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    await expect(
      adapter.lockForMembershipChange('target', 'teamspace', 'user', {
        query,
        queryRunner: { isTransactionActive: true },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      adapter.lockForMembershipChange('target', 'teamspace', 'user', {
        query,
        queryRunner: { isTransactionActive: false },
      }),
    ).rejects.toThrow('active transaction');
  });

  describe('lockForCreation', () => {
    it('locks the creator WorkspaceMember, then shares a lock on the active Workspace', async () => {
      const query = queryMock()
        .mockResolvedValueOnce([{ id: 'creator' }])
        .mockResolvedValueOnce([{ id: 'workspace' }]);

      await adapter.lockForCreation('creator', 'workspace', {
        query,
        queryRunner: { isTransactionActive: true },
      });

      expect(query).toHaveBeenCalledTimes(2);
      expect(query.mock.calls[0][0]).toContain('FROM workspace_members');
      expect(query.mock.calls[0][0]).toContain('FOR UPDATE');
      expect(query.mock.calls[0][1]).toEqual(['creator', 'workspace']);
      expect(query.mock.calls[1][0]).toContain('FROM workspaces');
      expect(query.mock.calls[1][0]).toContain('FOR SHARE');
      expect(query.mock.calls[1][1]).toEqual(['workspace']);
    });

    it.each([
      ['the creator is not a member', [[]], 1],
      ['the Workspace was soft-deleted', [[{ id: 'creator' }], []], 2],
    ])('rejects when %s', async (_case, responses, calls) => {
      const query = queryMock();
      for (const response of responses) query.mockResolvedValueOnce(response);

      await expect(
        adapter.lockForCreation('creator', 'workspace', {
          query,
          queryRunner: { isTransactionActive: true },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(query).toHaveBeenCalledTimes(calls);
    });

    it('requires an active transaction', async () => {
      const query = queryMock();

      await expect(
        adapter.lockForCreation('creator', 'workspace', {
          query,
          queryRunner: { isTransactionActive: false },
        }),
      ).rejects.toThrow('active transaction');
      expect(query).not.toHaveBeenCalled();
    });
  });
});
