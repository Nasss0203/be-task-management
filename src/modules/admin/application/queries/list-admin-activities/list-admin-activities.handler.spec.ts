import { BadRequestException } from '@nestjs/common';

import { ActivityEntityType } from 'src/modules/activity/domain/entities/activity.entity';

import type { AdminActivityReader } from '../../ports/admin-activity-reader.port';
import { ListAdminActivitiesHandler } from './list-admin-activities.handler';
import { ListAdminActivitiesQuery } from './list-admin-activities.query';

function createHandler(total = 0) {
  const listActivities = jest.fn().mockResolvedValue({
    items: [],
    total,
    page: 1,
    limit: 20,
  });
  const reader = { listActivities } as unknown as AdminActivityReader;

  return { handler: new ListAdminActivitiesHandler(reader), listActivities };
}

describe('ListAdminActivitiesHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('defaults to the last 7 days', async () => {
    const { handler, listActivities } = createHandler();

    await handler.execute(new ListAdminActivitiesQuery(1, 20));

    expect(listActivities).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      from: new Date('2026-11-11T12:00:00.000Z'),
      to: new Date('2026-11-18T12:00:00.000Z'),
    });
  });

  it('passes every filter to the reader', async () => {
    const { handler, listActivities } = createHandler();

    await handler.execute(
      new ListAdminActivitiesQuery(2, 50, {
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-10T00:00:00.000Z',
        workspaceId: 'workspace-1',
        actorId: 'user-1',
        search: 'nam',
        entityType: ActivityEntityType.PAGE,
      }),
    );

    expect(listActivities).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      from: new Date('2026-11-01T00:00:00.000Z'),
      to: new Date('2026-11-10T00:00:00.000Z'),
      workspaceId: 'workspace-1',
      actorId: 'user-1',
      search: 'nam',
      entityType: ActivityEntityType.PAGE,
    });
  });

  it('rejects a range longer than 90 days', async () => {
    const { handler, listActivities } = createHandler();

    await expect(
      handler.execute(
        new ListAdminActivitiesQuery(1, 20, {
          from: '2026-08-01T00:00:00.000Z',
          to: '2026-11-18T00:00:00.000Z',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(listActivities).not.toHaveBeenCalled();
  });

  it('rejects from after to', async () => {
    const { handler } = createHandler();

    await expect(
      handler.execute(
        new ListAdminActivitiesQuery(1, 20, {
          from: '2026-11-10T00:00:00.000Z',
          to: '2026-11-01T00:00:00.000Z',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('computes total pages and echoes the resolved range', async () => {
    const { handler } = createHandler(41);

    const result = await handler.execute(new ListAdminActivitiesQuery(1, 20));

    expect(result.totalPages).toBe(3);
    expect(result.to).toEqual(new Date('2026-11-18T12:00:00.000Z'));
  });
});
