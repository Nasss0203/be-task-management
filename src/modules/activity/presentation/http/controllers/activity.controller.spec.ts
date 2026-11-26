import { ActivityEntityType } from '../../../domain/entities/activity.entity';
import { FindActivityQueryDto } from '../../../application/dto/request/find-activity-query.dto';
import { GetActivitiesHandler } from '../../../application/queries/get-activities/get-activities.handler';
import { GetPageActivitiesHandler } from '../../../application/queries/get-page-activities/get-page-activities.handler';
import { GetPageActivitySummaryHandler } from '../../../application/queries/get-page-activity-summary/get-page-activity-summary.handler';
import { GetWorkspaceActivitiesHandler } from '../../../application/queries/get-workspace-activities/get-workspace-activities.handler';
import type { IAuth } from 'src/types/auth';
import { ActivityController } from './activity.controller';

describe('ActivityController', () => {
  const auth = { id: 'user-1' } as IAuth;
  const query = { limit: '10' } as FindActivityQueryDto;
  let getActivitiesHandler: { execute: jest.Mock };
  let controller: ActivityController;

  beforeEach(() => {
    getActivitiesHandler = { execute: jest.fn().mockResolvedValue({}) };
    controller = new ActivityController(
      getActivitiesHandler as unknown as GetActivitiesHandler,
      {} as GetPageActivitiesHandler,
      {} as GetPageActivitySummaryHandler,
      {} as GetWorkspaceActivitiesHandler,
    );
  });

  it('limits project activity to pages the reader can open', async () => {
    await controller.findByProject('workspace-1', 'project-1', query, auth);

    expect(getActivitiesHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        scope: { projectId: 'project-1', readableByUserId: 'user-1' },
      }),
    );
  });

  it('limits entity activity to pages the reader can open', async () => {
    await controller.findByEntity(
      'workspace-1',
      ActivityEntityType.DATABASE_ROW,
      'row-1',
      query,
      auth,
    );

    expect(getActivitiesHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        scope: {
          entityType: ActivityEntityType.DATABASE_ROW,
          entityId: 'row-1',
          readableByUserId: 'user-1',
        },
      }),
    );
  });
});
