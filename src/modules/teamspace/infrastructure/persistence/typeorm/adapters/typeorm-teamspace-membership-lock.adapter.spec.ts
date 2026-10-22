import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TypeOrmTeamspaceMembershipLock } from './typeorm-teamspace-membership-lock.adapter';

describe('TypeOrmTeamspaceMembershipLock', () => {
  const adapter = new TypeOrmTeamspaceMembershipLock();

  it('locks WorkspaceMembers in order, then the Teamspace on the supplied manager', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ workspace_id: 'workspace' }])
      .mockResolvedValueOnce([{ id: 'actor' }])
      .mockResolvedValueOnce([{ id: 'actor' }])
      .mockResolvedValueOnce([{ id: 'target' }])
      .mockResolvedValueOnce([{ id: 'actor' }])
      .mockResolvedValueOnce([{ id: 'teamspace' }]);
    const manager = { query, queryRunner: { isTransactionActive: true } };

    await adapter.lockForMembershipChange(
      'target',
      'teamspace',
      'user',
      manager,
    );

    expect(query).toHaveBeenCalledTimes(6);
    expect(query.mock.calls[2][0]).toContain('FOR UPDATE');
    expect(query.mock.calls[2][1]).toEqual(['actor', 'workspace']);
    expect(query.mock.calls[3][1]).toEqual(['target', 'workspace']);
    expect(query.mock.calls[4][1]).toEqual(['workspace', 'user']);
    expect(query.mock.calls[5][0]).toContain('FROM teamspaces');
    expect(query.mock.calls[5][0]).toContain('FOR UPDATE');
  });

  it.each([
    ['removed', []],
    ['re-created', [{ id: 'replacement' }]],
  ])(
    'rejects an actor whose membership was %s while waiting',
    async (_state, currentActor) => {
      const query = jest
        .fn()
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
    const query = jest
      .fn()
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
});
