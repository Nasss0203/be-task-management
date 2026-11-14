import type { PageActivityDetailsReader } from '../../ports/page-activity-details.reader.port';
import { GetPageActivitiesHandler } from '../get-page-activities/get-page-activities.handler';
import { GetPageActivitySummaryHandler } from './get-page-activity-summary.handler';
import { GetPageActivitySummaryQuery } from './get-page-activity-summary.query';

function setup(items: unknown[], creation: unknown) {
  const pageActivities = {
    execute: jest.fn().mockResolvedValue({ items, nextCursor: null }),
  };
  const reader = {
    findPageCreation: jest.fn().mockResolvedValue(creation),
    findNames: jest.fn().mockResolvedValue({
      rowTitles: new Map(),
      properties: new Map(),
      options: new Map(),
      users: new Map([['creator', 'nguyen nam']]),
    }),
  };
  const handler = new GetPageActivitySummaryHandler(
    pageActivities as unknown as GetPageActivitiesHandler,
    reader as unknown as PageActivityDetailsReader,
  );
  return { handler, pageActivities };
}

describe('GetPageActivitySummaryHandler', () => {
  const createdAt = new Date('2026-08-18T00:00:00Z');
  const editedAt = new Date('2026-11-05T00:00:00Z');

  it('returns the latest editor and the creator', async () => {
    const actor = { id: 'editor', username: 'nass', email: null };
    const { handler, pageActivities } = setup(
      [{ actor, createdAt: editedAt }],
      { createdBy: 'creator', createdAt },
    );

    const summary = await handler.execute(
      new GetPageActivitySummaryQuery('user-1', 'ws-1', 'page-1'),
    );

    expect(pageActivities.execute).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 'page-1', limit: '1' }),
    );
    expect(summary).toEqual({
      lastEdited: { actor, at: editedAt },
      created: {
        actor: { id: 'creator', username: 'nguyen nam' },
        at: createdAt,
      },
    });
  });

  it('has no last edit before any activity was recorded', async () => {
    const { handler } = setup([], { createdBy: 'creator', createdAt });

    const summary = await handler.execute(
      new GetPageActivitySummaryQuery('user-1', 'ws-1', 'page-1'),
    );

    expect(summary.lastEdited).toBeNull();
    expect(summary.created?.at).toBe(createdAt);
  });
});
