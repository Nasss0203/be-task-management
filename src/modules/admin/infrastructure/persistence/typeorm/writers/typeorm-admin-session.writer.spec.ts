import type { DataSource, EntityManager } from 'typeorm';

import { TypeOrmAdminSessionWriter } from './typeorm-admin-session.writer';

const actor = { userId: 'admin-1', ipAddress: '::1', userAgent: 'Chrome' };

const openSession = {
  id: 'session-1',
  userId: 'user-1',
  ipAddress: '10.0.0.1',
  userAgent: 'Firefox',
  open: true,
};

function createWriter(...results: unknown[]) {
  const query = jest.fn();
  results.forEach((result) =>
    result instanceof Error
      ? query.mockRejectedValueOnce(result)
      : query.mockResolvedValueOnce(result),
  );
  const manager = { query } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn(
      (callback: (manager: EntityManager) => Promise<unknown>) =>
        callback(manager),
    ),
  } as unknown as DataSource;

  return { writer: new TypeOrmAdminSessionWriter(dataSource), query };
}

function insertParameters(query: jest.Mock): unknown[] | undefined {
  const insert = query.mock.calls.find(([sql]: [string]) =>
    sql.includes('INSERT INTO admin_actions'),
  ) as [string, unknown[]] | undefined;

  return insert?.[1];
}

describe('TypeOrmAdminSessionWriter', () => {
  describe('revokeSession', () => {
    it('locks the session, revokes it and records the action without the token', async () => {
      const { writer, query } = createWriter([openSession], [[], 1], []);

      const outcome = await writer.revokeSession({
        sessionId: 'session-1',
        actor,
      });

      expect(outcome).toEqual({
        kind: 'DONE',
        session: {
          id: 'session-1',
          userId: 'user-1',
          revokedAt: expect.any(Date) as Date,
        },
      });
      const [selectSql] = query.mock.calls[0] as [string];
      expect(selectSql).toContain('FOR UPDATE');
      expect(selectSql).not.toMatch(/\btoken\b/);
      const [updateSql, updateParameters] = query.mock.calls[1] as [
        string,
        unknown[],
      ];
      expect(updateSql).toContain('UPDATE refresh_tokens SET revoked_at = $2');
      expect(updateParameters[0]).toBe('session-1');
      expect(updateParameters[1]).toBeInstanceOf(Date);

      const parameters = insertParameters(query);
      expect(parameters).toEqual(
        expect.arrayContaining([
          'admin-1',
          'SESSION_REVOKED',
          'USER',
          'user-1',
        ]),
      );
      const changes = parameters?.find(
        (value) => typeof value === 'string' && value.includes('sessionId'),
      ) as string;
      expect(JSON.parse(changes)).toEqual({
        sessionId: 'session-1',
        ipAddress: '10.0.0.1',
        userAgent: 'Firefox',
      });
    });

    it('returns NOT_FOUND when the session does not exist', async () => {
      const { writer, query } = createWriter([]);

      await expect(
        writer.revokeSession({ sessionId: 'missing', actor }),
      ).resolves.toEqual({ kind: 'NOT_FOUND' });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('returns UNCHANGED for a revoked or expired session without logging', async () => {
      const { writer, query } = createWriter([{ ...openSession, open: false }]);

      await expect(
        writer.revokeSession({ sessionId: 'session-1', actor }),
      ).resolves.toEqual({ kind: 'UNCHANGED' });
      expect(insertParameters(query)).toBeUndefined();
    });

    it('rejects when the action log cannot be written', async () => {
      const { writer } = createWriter(
        [openSession],
        [[], 1],
        new Error('insert failed'),
      );

      await expect(
        writer.revokeSession({ sessionId: 'session-1', actor }),
      ).rejects.toThrow('insert failed');
    });
  });

  describe('revokeUserSessions', () => {
    it('revokes every open session of the user and logs the count', async () => {
      const { writer, query } = createWriter(
        [{ id: 'user-1' }],
        [[{ id: 's1' }, { id: 's2' }], 2],
        [],
      );

      await expect(
        writer.revokeUserSessions({ userId: 'user-1', actor }),
      ).resolves.toEqual({ userId: 'user-1', revoked: 2 });
      const [updateSql, updateParameters] = query.mock.calls[1] as [
        string,
        unknown[],
      ];
      expect(updateSql).toContain('revoked_at IS NULL');
      expect(updateSql).toContain('expires_at > now()');
      expect(updateParameters[0]).toBe('user-1');
      expect(insertParameters(query)).toEqual(
        expect.arrayContaining([
          'USER_SESSIONS_REVOKED',
          'user-1',
          JSON.stringify({ revoked: 2 }),
        ]),
      );
    });

    it('still logs when the user has no open session', async () => {
      const { writer, query } = createWriter([{ id: 'user-1' }], [[], 0], []);

      await expect(
        writer.revokeUserSessions({ userId: 'user-1', actor }),
      ).resolves.toEqual({ userId: 'user-1', revoked: 0 });
      expect(insertParameters(query)).toEqual(
        expect.arrayContaining([JSON.stringify({ revoked: 0 })]),
      );
    });

    it('returns null when the user does not exist', async () => {
      const { writer, query } = createWriter([]);

      await expect(
        writer.revokeUserSessions({ userId: 'missing', actor }),
      ).resolves.toBeNull();
      expect(query).toHaveBeenCalledTimes(1);
    });
  });
});
