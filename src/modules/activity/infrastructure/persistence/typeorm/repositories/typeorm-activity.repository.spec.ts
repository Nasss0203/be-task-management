import { Repository } from 'typeorm';
import {
  ActivityAction,
  ActivityEntityType,
} from '../../../../domain/entities/activity.entity';
import { Activity } from '../entities/activity.orm-entity';
import { TypeOrmActivityRepository } from './typeorm-activity.repository';

function setup() {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  const repo = {
    query: jest.fn().mockResolvedValue([{ workspace_id: 'ws-1' }]),
    save: jest.fn((entity: Activity) =>
      Promise.resolve({ ...entity, id: 'a-1', createdAt: new Date() }),
    ),
    createQueryBuilder: jest.fn(() => qb),
  };
  const activities = new TypeOrmActivityRepository(
    repo as unknown as Repository<Activity>,
  );
  return { activities, repo, qb };
}

describe('TypeOrmActivityRepository', () => {
  it.each([
    [ActivityEntityType.PAGE_BLOCK, ActivityAction.PAGE_BLOCK_UPDATED, 'b-1'],
    [
      ActivityEntityType.DATABASE_ROW,
      ActivityAction.DATABASE_ROW_UPDATED,
      'r-1',
    ],
  ])('stores the page of a %s edit', async (entityType, action, entityId) => {
    const { activities, repo } = setup();

    await activities.recordOnPage(
      {
        actorId: 'user-1',
        pageId: 'page-1',
        entityType,
        entityId,
        action,
        metadata: null,
      },
      null,
    );

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        pageId: 'page-1',
        entityId,
      }),
    );
  });

  it('filters by page and leaves out excluded entity types', async () => {
    const { activities, qb } = setup();

    await activities.findMany({
      workspaceId: 'ws-1',
      pageId: 'page-1',
      excludeEntityTypes: [ActivityEntityType.COMMENT],
    });

    expect(qb.andWhere).toHaveBeenCalledWith('activity.pageId = :pageId', {
      pageId: 'page-1',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'activity.entityType NOT IN (:...excludeEntityTypes)',
      { excludeEntityTypes: [ActivityEntityType.COMMENT] },
    );
  });

  it('adds no page filter when none is asked', async () => {
    const { activities, qb } = setup();

    await activities.findMany({ workspaceId: 'ws-1' });

    expect(qb.andWhere).not.toHaveBeenCalled();
  });
});
