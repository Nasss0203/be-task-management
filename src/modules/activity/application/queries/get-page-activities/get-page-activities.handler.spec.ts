import { ForbiddenException } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { ActivityEntityType } from '../../../domain/entities/activity.entity';
import { GetActivitiesHandler } from '../get-activities/get-activities.handler';
import { GetPageActivitiesHandler } from './get-page-activities.handler';
import { GetPageActivitiesQuery } from './get-page-activities.query';

function setup(allowed: boolean) {
  const getActivities = {
    execute: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
  };
  const authorization = { authorize: jest.fn().mockResolvedValue(allowed) };
  const handler = new GetPageActivitiesHandler(
    getActivities as unknown as GetActivitiesHandler,
    authorization as unknown as AuthorizationService,
  );
  return { handler, getActivities, authorization };
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
});
