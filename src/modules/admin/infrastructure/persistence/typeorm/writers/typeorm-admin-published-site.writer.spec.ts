import type { DataSource, EntityManager } from 'typeorm';

import { TypeOrmAdminPublishedSiteWriter } from './typeorm-admin-published-site.writer';

const actor = { userId: 'admin-1', ipAddress: '::1', userAgent: 'Chrome' };

const activeSite = {
  id: 'site-1',
  disabledAt: null,
  moderationDisabledAt: null,
  moderationDisabledBy: null,
  moderationReason: null,
};

const moderatedSite = {
  id: 'site-1',
  disabledAt: '2026-11-19T06:00:00.000Z',
  moderationDisabledAt: '2026-11-19T06:00:00.000Z',
  moderationDisabledBy: 'admin-1',
  moderationReason: 'Spam',
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

  return { writer: new TypeOrmAdminPublishedSiteWriter(dataSource), query };
}

function insertParameters(query: jest.Mock): unknown[] | undefined {
  const insert = query.mock.calls.find(([sql]: [string]) =>
    sql.includes('INSERT INTO admin_actions'),
  ) as [string, unknown[]] | undefined;

  return insert?.[1];
}

describe('TypeOrmAdminPublishedSiteWriter', () => {
  it('disables the site and records the reason in the same transaction', async () => {
    const { writer, query } = createWriter(
      [activeSite],
      [[moderatedSite], 1],
      [],
    );

    const outcome = await writer.disableSite({
      siteId: 'site-1',
      reason: 'Spam',
      actor,
    });

    expect(outcome).toEqual({
      kind: 'DONE',
      site: {
        id: 'site-1',
        disabledAt: new Date(moderatedSite.disabledAt),
        moderation: {
          disabledAt: new Date(moderatedSite.moderationDisabledAt),
          disabledBy: 'admin-1',
          reason: 'Spam',
        },
      },
    });
    const [updateSql, updateParameters] = query.mock.calls[1] as [
      string,
      unknown[],
    ];
    expect(updateSql).toContain('COALESCE(disabled_at, CURRENT_TIMESTAMP)');
    expect(updateParameters).toEqual(['site-1', 'admin-1', 'Spam']);
    const parameters = insertParameters(query);
    expect(parameters?.slice(0, 4)).toEqual([
      'admin-1',
      'PUBLISHED_SITE_DISABLED',
      'PUBLISHED_SITE',
      'site-1',
    ]);
    expect(JSON.parse(parameters?.[4] as string)).toEqual({
      disabledByAdmin: { from: false, to: true },
      reason: { to: 'Spam' },
    });
  });

  it('does not disable a site twice', async () => {
    const { writer, query } = createWriter([moderatedSite]);

    await expect(
      writer.disableSite({ siteId: 'site-1', reason: 'Spam', actor }),
    ).resolves.toEqual({ kind: 'UNCHANGED' });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns not found for a missing site', async () => {
    const { writer, query } = createWriter([]);

    await expect(
      writer.restoreSite({ siteId: 'missing', actor }),
    ).resolves.toEqual({ kind: 'NOT_FOUND' });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('fails the takedown when the audit row cannot be written', async () => {
    const { writer } = createWriter(
      [activeSite],
      [[moderatedSite], 1],
      new Error('insert failed'),
    );

    await expect(
      writer.disableSite({ siteId: 'site-1', reason: 'Spam', actor }),
    ).rejects.toThrow('insert failed');
  });

  it('restores only the moderation flag and keeps the site disabled', async () => {
    const { writer, query } = createWriter(
      [moderatedSite],
      [
        [
          {
            ...moderatedSite,
            moderationDisabledAt: null,
            moderationDisabledBy: null,
            moderationReason: null,
          },
        ],
        1,
      ],
      [],
    );

    const outcome = await writer.restoreSite({ siteId: 'site-1', actor });

    expect(outcome).toEqual({
      kind: 'DONE',
      site: {
        id: 'site-1',
        disabledAt: new Date(moderatedSite.disabledAt),
        moderation: null,
      },
    });
    const [updateSql] = query.mock.calls[1] as [string];
    expect(updateSql).not.toMatch(/\bdisabled_at = NULL/);
    expect(JSON.parse(insertParameters(query)?.[4] as string)).toEqual({
      disabledByAdmin: { from: true, to: false },
      reason: { from: 'Spam' },
    });
  });

  it('does not restore a site that is not disabled by an administrator', async () => {
    const { writer } = createWriter([activeSite]);

    await expect(
      writer.restoreSite({ siteId: 'site-1', actor }),
    ).resolves.toEqual({ kind: 'UNCHANGED' });
  });
});
