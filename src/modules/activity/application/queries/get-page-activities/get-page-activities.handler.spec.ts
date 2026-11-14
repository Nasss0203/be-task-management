import { ForbiddenException } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import {
  ActivityAction,
  ActivityEntityType,
} from '../../../domain/entities/activity.entity';
import type { ActivityResponseDto } from '../../dto/response/activity.response.dto';
import type {
  ActivityTargetNames,
  PageActivityDetailsReader,
} from '../../ports/page-activity-details.reader.port';
import { GetActivitiesHandler } from '../get-activities/get-activities.handler';
import { GetPageActivitiesHandler } from './get-page-activities.handler';
import { GetPageActivitiesQuery } from './get-page-activities.query';

function item(overrides: Partial<ActivityResponseDto>): ActivityResponseDto {
  return {
    id: 'a-1',
    workspaceId: 'ws-1',
    pageId: 'page-1',
    projectId: null,
    entityType: ActivityEntityType.DATABASE_ROW,
    entityId: 'row-1',
    actorId: 'user-1',
    action: ActivityAction.DATABASE_ROW_UPDATED,
    field: 'prop-tags',
    oldValue: null,
    newValue: null,
    metadata: { databaseId: 'db-1' },
    isSystem: false,
    createdAt: new Date('2026-11-07T08:00:00Z'),
    ...overrides,
  };
}

const names: ActivityTargetNames = {
  rowTitles: new Map([['row-1', 'New skill']]),
  properties: new Map([
    ['prop-tags', { name: 'Tags', type: 'MULTI_SELECT' }],
    ['prop-owner', { name: 'Assignee', type: 'PERSON' }],
    ['prop-note', { name: 'Note', type: 'TEXT' }],
  ]),
  options: new Map([['opt-done', { name: 'done', color: 'green' }]]),
  users: new Map([['user-2', 'nam']]),
};

function setup(allowed: boolean, items: ActivityResponseDto[] = []) {
  const getActivities = {
    execute: jest.fn().mockResolvedValue({ items, nextCursor: null }),
  };
  const authorization = { authorize: jest.fn().mockResolvedValue(allowed) };
  const reader = {
    findNames: jest.fn().mockResolvedValue(names),
    findPageCreation: jest.fn(),
  };
  const handler = new GetPageActivitiesHandler(
    getActivities as unknown as GetActivitiesHandler,
    authorization as unknown as AuthorizationService,
    reader as unknown as PageActivityDetailsReader,
  );
  return { handler, getActivities, authorization, reader };
}

describe('GetPageActivitiesHandler', () => {
  it('lists the page activity without comments', async () => {
    const { handler, getActivities, authorization } = setup(true);

    await handler.execute(
      new GetPageActivitiesQuery('user-1', 'ws-1', 'page-1', 'cur', '10'),
    );

    expect(authorization.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.ACTIVITY_READ],
      target: { type: 'workspace', id: 'ws-1' },
    });
    expect(getActivities.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        filters: { cursor: 'cur', limit: '10' },
        scope: {
          pageId: 'page-1',
          excludeEntityTypes: [ActivityEntityType.COMMENT],
        },
      }),
    );
  });

  it('refuses a reader without activity.read in the workspace', async () => {
    const { handler, getActivities } = setup(false);

    await expect(
      handler.execute(new GetPageActivitiesQuery('guest', 'ws-1', 'page-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(getActivities.execute).not.toHaveBeenCalled();
  });

  it('names the row, the property and the new options or people', async () => {
    const { handler, reader } = setup(true, [
      item({ id: 'tags', newValue: ['opt-done', 'opt-gone'] }),
      item({ id: 'owner', field: 'prop-owner', newValue: ['user-2'] }),
      item({ id: 'note', field: 'prop-note', newValue: 'short text' }),
    ]);

    const { items } = await handler.execute(
      new GetPageActivitiesQuery('user-1', 'ws-1', 'page-1'),
    );

    expect(reader.findNames).toHaveBeenCalledTimes(1);
    expect(items.map((entry) => entry.target)).toEqual([
      {
        rowTitle: 'New skill',
        propertyName: 'Tags',
        propertyType: 'MULTI_SELECT',
        options: [{ id: 'opt-done', name: 'done', color: 'green' }],
        people: [],
      },
      {
        rowTitle: 'New skill',
        propertyName: 'Assignee',
        propertyType: 'PERSON',
        options: [],
        people: [{ id: 'user-2', username: 'nam' }],
      },
      {
        rowTitle: 'New skill',
        propertyName: 'Note',
        propertyType: 'TEXT',
        options: [],
        people: [],
      },
    ]);
  });

  it('leaves names empty for a deleted row and no target for a block', async () => {
    const { handler } = setup(true, [
      item({ id: 'gone', entityId: 'row-deleted', field: 'prop-deleted' }),
      item({
        id: 'block',
        entityType: ActivityEntityType.PAGE_BLOCK,
        entityId: 'b-1',
        action: ActivityAction.PAGE_BLOCK_UPDATED,
        field: null,
      }),
    ]);

    const { items } = await handler.execute(
      new GetPageActivitiesQuery('user-1', 'ws-1', 'page-1'),
    );

    expect(items[0].target).toEqual({
      rowTitle: null,
      propertyName: null,
      propertyType: null,
      options: [],
      people: [],
    });
    expect(items[1].target).toBeNull();
  });
});
