import type { DataSource } from 'typeorm';

import { TypeOrmAdminSessionReader } from './typeorm-admin-session.reader';

function createReader(...results: unknown[]) {
  const query = jest.fn();
  results.forEach((result) => query.mockResolvedValueOnce(result));
  const dataSource = { query } as unknown as DataSource;

  return { reader: new TypeOrmAdminSessionReader(dataSource), query };
}

describe('TypeOrmAdminSessionReader.listSessions', () => {
  it('filters by user id as the third parameter', async () => {
    const { reader, query } = createReader([], [{ total: 0 }]);

    await reader.listSessions({ page: 2, limit: 20, userId: 'user-1' });

    const [listSql, listParameters] = query.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(listSql).toContain(
      '($3::uuid IS NULL OR refresh_token.user_id = $3)',
    );
    expect(listSql).toContain('LIMIT $4');
    expect(listParameters).toEqual([null, null, 'user-1', 20, 20]);
    expect((query.mock.calls[1] as [string, unknown[]])[1]).toEqual([
      null,
      null,
      'user-1',
    ]);
  });

  it('passes null when no user id is given', async () => {
    const { reader, query } = createReader([], [{ total: 0 }]);

    await reader.listSessions({ page: 1, limit: 20 });

    expect((query.mock.calls[1] as [string, unknown[]])[1]).toEqual([
      null,
      null,
      null,
    ]);
  });
});

describe('TypeOrmAdminSessionReader.getUserIpHistory', () => {
  it('groups the issued tokens of the last 90 days by IP and device', async () => {
    const { reader, query } = createReader(
      [{ id: 'user-1', since: '2026-08-21T07:00:00.000Z' }],
      [
        {
          ipAddress: '113.1.1.1',
          userAgent: 'Chrome',
          firstSeenAt: '2026-11-18T02:10:00.000Z',
          lastSeenAt: '2026-11-19T07:53:00.000Z',
          tokensIssued: '37',
          hasOpenSession: true,
        },
        {
          ipAddress: null,
          userAgent: null,
          firstSeenAt: '2026-11-13T05:46:00.000Z',
          lastSeenAt: '2026-11-17T09:34:00.000Z',
          tokensIssued: 4,
          hasOpenSession: false,
        },
      ],
    );

    const history = await reader.getUserIpHistory('user-1');

    expect(history).toEqual({
      userId: 'user-1',
      since: new Date('2026-08-21T07:00:00.000Z'),
      items: [
        {
          ipAddress: '113.1.1.1',
          userAgent: 'Chrome',
          firstSeenAt: new Date('2026-11-18T02:10:00.000Z'),
          lastSeenAt: new Date('2026-11-19T07:53:00.000Z'),
          tokensIssued: 37,
          hasOpenSession: true,
        },
        {
          ipAddress: null,
          userAgent: null,
          firstSeenAt: new Date('2026-11-13T05:46:00.000Z'),
          lastSeenAt: new Date('2026-11-17T09:34:00.000Z'),
          tokensIssued: 4,
          hasOpenSession: false,
        },
      ],
    });
    const [sql, parameters] = query.mock.calls[1] as [string, unknown[]];
    expect(sql).toContain(
      'GROUP BY refresh_token.ip_address, refresh_token.user_agent',
    );
    expect(sql).toContain('make_interval(days => $2)');
    expect(sql).toContain('LIMIT $3');
    expect(sql).not.toMatch(/refresh_token\.token\b/);
    expect(parameters).toEqual(['user-1', 90, 50]);
  });

  it('returns null without reading tokens when the user does not exist', async () => {
    const { reader, query } = createReader([]);

    await expect(reader.getUserIpHistory('missing')).resolves.toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns an empty list when the user has no token', async () => {
    const { reader } = createReader(
      [{ id: 'user-1', since: '2026-08-21T07:00:00.000Z' }],
      [],
    );

    await expect(reader.getUserIpHistory('user-1')).resolves.toMatchObject({
      items: [],
    });
  });
});

describe('TypeOrmAdminSessionReader.listLoginAttempts', () => {
  const since = '2026-08-21T00:00:00.000Z';

  it('reads the last 90 days with filters and maps the user', async () => {
    const { reader, query } = createReader(
      [{ exists: true, since }],
      [
        {
          id: 'attempt-1',
          method: 'PASSWORD',
          result: 'FAILED',
          reason: 'WRONG_PASSWORD',
          attemptedEmail: 'user@example.com',
          ipAddress: '203.0.113.5',
          userAgent: 'Jest browser',
          createdAt: '2026-11-19T08:00:00.000Z',
          userId: 'user-1',
          username: 'user',
          email: 'user@example.com',
        },
      ],
      [{ total: '1' }],
    );

    const result = await reader.listLoginAttempts({
      page: 1,
      limit: 20,
      result: 'FAILED',
      method: 'PASSWORD',
      search: ' 203.0 ',
      userId: 'user-1',
    });

    const [listSql, listParameters] = query.mock.calls[1] as [
      string,
      unknown[],
    ];
    expect(listSql).toContain('make_interval(days => $1)');
    expect(listSql).toContain('attempt.user_id IS NULL');
    expect(listSql).not.toContain('password_hash');
    expect(listParameters).toEqual([
      90,
      'FAILED',
      'PASSWORD',
      '203.0',
      'user-1',
      20,
      0,
    ]);
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: 'attempt-1',
          reason: 'WRONG_PASSWORD',
          createdAt: new Date('2026-11-19T08:00:00.000Z'),
          user: { id: 'user-1', username: 'user', email: 'user@example.com' },
        }),
      ],
      total: 1,
      page: 1,
      limit: 20,
      since: new Date(since),
    });
  });

  it('returns null without listing when the user does not exist', async () => {
    const { reader, query } = createReader([{ exists: false, since }]);

    await expect(
      reader.listLoginAttempts({ page: 1, limit: 20, userId: 'missing' }),
    ).resolves.toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('keeps an attempt without a matching account as user null', async () => {
    const { reader } = createReader(
      [{ exists: true, since }],
      [
        {
          id: 'attempt-2',
          method: 'PASSWORD',
          result: 'FAILED',
          reason: 'USER_NOT_FOUND',
          attemptedEmail: 'ghost@example.com',
          ipAddress: null,
          userAgent: null,
          createdAt: '2026-11-19T08:00:00.000Z',
          userId: null,
          username: null,
          email: null,
        },
      ],
      [{ total: 1 }],
    );

    const result = await reader.listLoginAttempts({ page: 1, limit: 20 });

    expect(result?.items[0]?.user).toBeNull();
  });
});
