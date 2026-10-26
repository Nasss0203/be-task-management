import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { Database } from 'src/modules/database/domain/aggregates/database/database.aggregate';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { FindDatabasesByWorkspaceHandler } from './find-databases-by-workspace.handler';
import { FindDatabasesByWorkspaceQuery } from './find-databases-by-workspace.query';

function databaseBlock(
  id: string,
  databaseId: string,
  deletedAt: Date | null,
  parentBlockId: string | null = null,
): PageBlock {
  return PageBlock.restore({
    id,
    pageId: 'page-1',
    parentBlockId,
    type: PageBlockType.DATABASE_VIEW,
    title: null,
    positionX: null,
    positionY: null,
    width: null,
    height: null,
    orderIndex: 3,
    content: {},
    styleConfig: {},
    dataConfig: { database_id: databaseId, view_id: 'view-1' },
    createdBy: 'user-1',
    isOpen: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt,
    deletedBy: deletedAt ? 'user-1' : null,
  });
}

function database(id: string): Database {
  return {
    getId: () => id,
    getPageId: () => 'page-1',
    getName: () => id,
  } as unknown as Database;
}

describe('FindDatabasesByWorkspaceHandler', () => {
  const older = new Date('2026-10-01');
  const newer = new Date('2026-10-20');

  const handler = new FindDatabasesByWorkspaceHandler(
    {
      findAccessibleByWorkspace: jest
        .fn()
        .mockResolvedValue([{ getId: () => 'page-1' }]),
    } as unknown as PageRepository,
    {
      findDatabaseViewBlocksByPageIds: jest.fn().mockResolvedValue([
        // Repository order: live blocks first, then latest-deleted first.
        databaseBlock('b-live', 'db-live', null),
        databaseBlock('b-trash-new', 'db-trash', newer),
        databaseBlock('b-live-old', 'db-live', older),
        databaseBlock('b-trash-old', 'db-trash', older),
      ]),
    } as unknown as PageBlockRepository,
    {
      findByPageIds: jest
        .fn()
        .mockResolvedValue([
          database('db-live'),
          database('db-trash'),
          database('db-orphan'),
        ]),
    } as unknown as DatabaseRepository,
  );

  it('lists only databases still shown by a live block for the sidebar', async () => {
    const result = await handler.execute(
      new FindDatabasesByWorkspaceQuery('ws-1', 'user-1', false),
    );

    expect(result).toEqual([
      { id: 'db-live', pageId: 'page-1', name: 'db-live', deletedAt: null },
    ]);
  });

  it('lists databases whose blocks are all deleted for the Trash', async () => {
    const result = await handler.execute(
      new FindDatabasesByWorkspaceQuery('ws-1', 'user-1', true),
    );

    expect(result).toEqual([
      { id: 'db-trash', pageId: 'page-1', name: 'db-trash', deletedAt: newer },
    ]);
  });
});
