import { BadRequestException } from '@nestjs/common';

import { Database } from '../../../domain/aggregates/database/database.aggregate';
import type { CalendarFeed } from '../../../domain/repositories/calendar-feed.repository';
import { UpsertCalendarFeedCommand } from './upsert-calendar-feed.command';
import { UpsertCalendarFeedHandler } from './upsert-calendar-feed.handler';

describe('UpsertCalendarFeedHandler', () => {
  const databases = {
    findById: jest.fn(),
  };
  const feeds = {
    findActive: jest.fn(),
    save: jest.fn<Promise<void>, [CalendarFeed]>(),
  };
  const tokens = {
    generate: jest.fn((id: string) => `token-${id}`),
  };
  const handler = new UpsertCalendarFeedHandler(
    databases as never,
    feeds as never,
    tokens as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    databases.findById.mockResolvedValue(
      Database.create({
        id: 'db',
        pageId: 'page',
        name: 'Tasks',
        titlePropertyId: 'title',
        assigneePropertyId: 'assignee',
        dueDatePropertyId: 'due',
      }),
    );
    feeds.findActive.mockResolvedValue(null);
  });

  it('creates a feed for a Date property', async () => {
    const result = await handler.execute(
      new UpsertCalendarFeedCommand('db', 'due', 'user'),
    );

    const [saved] = feeds.save.mock.calls[0];
    expect(feeds.save).toHaveBeenCalledWith({
      id: expect.any(String) as string,
      databaseId: 'db',
      datePropertyId: 'due',
      createdBy: 'user',
    });
    expect(result).toEqual({
      token: `token-${saved.id}`,
      datePropertyId: 'due',
    });
  });

  it('keeps the existing feed id when switching the property', async () => {
    feeds.findActive.mockResolvedValue({
      id: 'feed-1',
      databaseId: 'db',
      datePropertyId: 'old',
      createdBy: 'user',
    });

    const result = await handler.execute(
      new UpsertCalendarFeedCommand('db', 'due', 'user'),
    );

    expect(feeds.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'feed-1', datePropertyId: 'due' }),
    );
    expect(result.token).toBe('token-feed-1');
  });

  it('rejects a property that is not a Date', async () => {
    await expect(
      handler.execute(new UpsertCalendarFeedCommand('db', 'title', 'user')),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(feeds.save).not.toHaveBeenCalled();
  });
});
