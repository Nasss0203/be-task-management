import { NotFoundException } from '@nestjs/common';

import { Database } from '../../../domain/aggregates/database/database.aggregate';
import { GetCalendarFeedIcsHandler } from './get-calendar-feed-ics.handler';
import { GetCalendarFeedIcsQuery } from './get-calendar-feed-ics.query';

const FEED_ID = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';

describe('GetCalendarFeedIcsHandler', () => {
  const feeds = {
    findActiveById: jest.fn(),
  };
  const databases = {
    findById: jest.fn(),
  };
  const rows = {
    findByDatabaseId: jest.fn(),
  };
  const tokens = {
    verify: jest.fn(),
  };
  const authorization = {
    authorize: jest.fn(),
  };
  const handler = new GetCalendarFeedIcsHandler(
    feeds as never,
    databases as never,
    rows as never,
    tokens as never,
    authorization as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    tokens.verify.mockReturnValue({ linkId: FEED_ID });
    feeds.findActiveById.mockResolvedValue({
      id: FEED_ID,
      databaseId: 'db',
      datePropertyId: 'due',
      createdBy: 'user',
    });
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
    rows.findByDatabaseId.mockResolvedValue([]);
    authorization.authorize.mockResolvedValue(true);
  });

  it('returns the calendar when the feed owner can still read the page', async () => {
    const ics = await handler.execute(new GetCalendarFeedIcsQuery('token'));

    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(authorization.authorize).toHaveBeenCalledWith({
      userId: 'user',
      permissions: ['page_block.read'],
      target: { type: 'page', id: 'page' },
    });
  });

  it('returns not found for an invalid token without touching the feeds', async () => {
    tokens.verify.mockReturnValue(null);

    await expect(
      handler.execute(new GetCalendarFeedIcsQuery('bad')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(feeds.findActiveById).not.toHaveBeenCalled();
  });

  it('returns not found for a revoked feed', async () => {
    feeds.findActiveById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetCalendarFeedIcsQuery('token')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns not found without reading rows when the owner lost access', async () => {
    authorization.authorize.mockResolvedValue(false);

    await expect(
      handler.execute(new GetCalendarFeedIcsQuery('token')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(rows.findByDatabaseId).not.toHaveBeenCalled();
  });
});
