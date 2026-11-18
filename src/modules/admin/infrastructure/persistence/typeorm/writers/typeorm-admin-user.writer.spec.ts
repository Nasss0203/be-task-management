import type { DataSource, EntityManager } from 'typeorm';

import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

import { TypeOrmAdminUserWriter } from './typeorm-admin-user.writer';

const actor = { userId: 'admin-1', ipAddress: '::1', userAgent: 'Chrome' };

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

  return { writer: new TypeOrmAdminUserWriter(dataSource), query };
}

function insertedChanges(query: jest.Mock): unknown {
  const insert = query.mock.calls.find(([sql]: [string]) =>
    sql.includes('INSERT INTO admin_actions'),
  ) as [string, unknown[]] | undefined;

  return insert ? JSON.parse(insert[1][4] as string) : undefined;
}

describe('TypeOrmAdminUserWriter', () => {
  it('records the previous and new role in the same transaction', async () => {
    const { writer, query } = createWriter(
      [{ isActive: true, systemRole: SystemRole.USER }],
      [
        [
          {
            id: 'user-1',
            systemRole: SystemRole.SYSTEM_ADMIN,
            updatedAt: '2026-11-18T08:00:00.000Z',
          },
        ],
        1,
      ],
      [],
    );

    const result = await writer.updateUserRole({
      userId: 'user-1',
      systemRole: SystemRole.SYSTEM_ADMIN,
      actor,
    });

    expect(result?.systemRole).toBe(SystemRole.SYSTEM_ADMIN);
    expect(insertedChanges(query)).toEqual({
      systemRole: { from: SystemRole.USER, to: SystemRole.SYSTEM_ADMIN },
    });
    const [, insertParameters] = query.mock.calls[2] as [string, unknown[]];
    expect(insertParameters.slice(0, 4)).toEqual([
      'admin-1',
      'USER_ROLE_CHANGED',
      'USER',
      'user-1',
    ]);
  });

  it('records a status change', async () => {
    const { writer, query } = createWriter(
      [{ isActive: true, systemRole: SystemRole.USER }],
      [
        [
          {
            id: 'user-1',
            isActive: false,
            updatedAt: '2026-11-18T08:00:00.000Z',
          },
        ],
        1,
      ],
      [],
    );

    await writer.updateUserStatus({ userId: 'user-1', isActive: false, actor });

    expect(insertedChanges(query)).toEqual({
      isActive: { from: true, to: false },
    });
  });

  it('fails the change when the audit row cannot be written', async () => {
    const { writer } = createWriter(
      [{ isActive: true, systemRole: SystemRole.USER }],
      [
        [
          {
            id: 'user-1',
            systemRole: SystemRole.SYSTEM_ADMIN,
            updatedAt: '2026-11-18T08:00:00.000Z',
          },
        ],
        1,
      ],
      new Error('insert failed'),
    );

    await expect(
      writer.updateUserRole({
        userId: 'user-1',
        systemRole: SystemRole.SYSTEM_ADMIN,
        actor,
      }),
    ).rejects.toThrow('insert failed');
  });

  it('returns null without recording when the user does not exist', async () => {
    const { writer, query } = createWriter([]);

    await expect(
      writer.updateUserStatus({ userId: 'missing', isActive: false, actor }),
    ).resolves.toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
  });
});
