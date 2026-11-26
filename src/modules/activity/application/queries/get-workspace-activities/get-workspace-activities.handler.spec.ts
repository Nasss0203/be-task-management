import {
  ActivityAction,
  ActivityEntityType,
} from '../../../domain/entities/activity.entity';
import type { ActivityResponseDto } from '../../dto/response/activity.response.dto';
import type {
  ActivityPageSummary,
  ActivityTargetNames,
  PageActivityDetailsReader,
} from '../../ports/page-activity-details.reader.port';
import { GetActivitiesHandler } from '../get-activities/get-activities.handler';
import { GetWorkspaceActivitiesHandler } from './get-workspace-activities.handler';
import { GetWorkspaceActivitiesQuery } from './get-workspace-activities.query';

function item(overrides: Partial<ActivityResponseDto>): ActivityResponseDto {
  return {
    id: 'a-1',
    workspaceId: 'ws-1',
    pageId: 'page-1',
    projectId: null,
    entityType: ActivityEntityType.DATABASE_ROW,
    entityId: 'row-1',
    actorId: 'user-1',
    action: ActivityAction.DATABASE_ROW_CREATED,
    field: null,
    oldValue: null,
    newValue: null,
    metadata: { databaseId: 'db-1' },
    isSystem: false,
    createdAt: new Date('2026-11-24T08:00:00Z'),
    ...overrides,
  };
}

const names: ActivityTargetNames = {
  rowTitles: new Map([['row-1', 'Launch']]),
  properties: new Map(),
  options: new Map(),
  users: new Map(),
};

const pages = new Map<string, ActivityPageSummary>([
  ['page-1', { id: 'page-1', title: 'Roadmap', icon: '🗺️' }],
]);

function setup(items: ActivityResponseDto[] = []) {
  const getActivities = {
    execute: jest.fn().mockResolvedValue({ items, nextCursor: 'next' }),
  };
  const reader = {
    findNames: jest.fn().mockResolvedValue(names),
    findPageCreation: jest.fn(),
    findPages: jest.fn().mockResolvedValue(pages),
  };
  const handler = new GetWorkspaceActivitiesHandler(
    getActivities as unknown as GetActivitiesHandler,
    reader as unknown as PageActivityDetailsReader,
  );
  return { handler, getActivities, reader };
}

describe('GetWorkspaceActivitiesHandler', () => {
  it('asks only for activity the reader can open, without comments', async () => {
    const { handler, getActivities } = setup();

    await handler.execute(
      new GetWorkspaceActivitiesQuery('user-1', 'ws-1', {
        cursor: 'cur',
        limit: '10',
      }),
    );

    expect(getActivities.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        filters: { cursor: 'cur', limit: '10' },
        scope: {
          readableByUserId: 'user-1',
          excludeEntityTypes: [ActivityEntityType.COMMENT],
        },
      }),
    );
  });

  it('adds the page and the row name to each item', async () => {
    const { handler, reader } = setup([
      item({ id: 'row' }),
      item({ id: 'gone', pageId: 'page-gone' }),
    ]);

    const result = await handler.execute(
      new GetWorkspaceActivitiesQuery('user-1', 'ws-1', {}),
    );

    expect(reader.findPages).toHaveBeenCalledWith(['page-1', 'page-gone']);
    expect(result.nextCursor).toBe('next');
    expect(result.items[0].page).toEqual({
      id: 'page-1',
      title: 'Roadmap',
      icon: '🗺️',
    });
    expect(result.items[0].target?.rowTitle).toBe('Launch');
    expect(result.items[1].page).toBeNull();
  });
});
