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

  it('merges a row edit per property and keeps the newest value', async () => {
    const { activities, repo } = setup();
    repo.query.mockResolvedValueOnce([[{ id: 'a-1' }], 1]);

    await activities.recordOnPage(
      {
        actorId: 'user-1',
        pageId: 'page-1',
        entityType: ActivityEntityType.DATABASE_ROW,
        entityId: 'row-1',
        action: ActivityAction.DATABASE_ROW_UPDATED,
        field: 'prop-1',
        newValue: ['opt-1'],
        metadata: { databaseId: 'db-1' },
      },
      300000,
    );

    const [sql, params] = repo.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('field IS NOT DISTINCT FROM $6');
    expect(sql).toContain('new_value = $7::jsonb');
    expect(params.slice(5)).toEqual([
      'prop-1',
      JSON.stringify(['opt-1']),
      JSON.stringify({ databaseId: 'db-1' }),
    ]);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('stores the new value when nothing is merged', async () => {
    const { activities, repo } = setup();
    repo.query
      .mockResolvedValueOnce([[], 0])
      .mockResolvedValueOnce([{ workspace_id: 'ws-1' }]);

    await activities.recordOnPage(
      {
        actorId: 'user-1',
        pageId: 'page-1',
        entityType: ActivityEntityType.DATABASE_ROW,
        entityId: 'row-1',
        action: ActivityAction.DATABASE_ROW_UPDATED,
        field: 'prop-1',
        newValue: 'done',
        metadata: null,
      },
      300000,
    );

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ newValue: 'done', field: 'prop-1' }),
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

  it('keeps only activity on pages the reader can open through membership', async () => {
    const { activities, qb } = setup();

    await activities.findMany({
      workspaceId: 'ws-1',
      readableByUserId: 'user-1',
    });

    const [condition, params] = qb.andWhere.mock.calls[0] as [
      string,
      Record<string, string>,
    ];
    expect(params).toEqual({ readableByUserId: 'user-1' });
    expect(condition).toContain('p.id = activity.page_id');
    expect(condition).toContain('p.deleted_at IS NULL');
    expect(condition).toContain("wm.membership_type = 'MEMBER'");
    expect(condition).toContain('p.teamspace_id IS NULL');
    expect(condition).toContain('tm.workspace_member_id = wm.id');
    expect(condition).toContain('t.deleted_at IS NULL');
  });

  it('adds no page filter when none is asked', async () => {
    const { activities, qb } = setup();

    await activities.findMany({ workspaceId: 'ws-1' });

    expect(qb.andWhere).not.toHaveBeenCalled();
  });
});
