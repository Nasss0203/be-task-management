import { BadRequestException } from '@nestjs/common';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { RestorePageDatabaseCommand } from './restore-page-database.command';
import { RestorePageDatabaseHandler } from './restore-page-database.handler';

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

function setup(blocks: PageBlock[]) {
  const pageBlockRepo = {
    findDatabaseViewBlocksByPageIds: jest.fn().mockResolvedValue(blocks),
    // Parent toggle is still deleted.
    findById: jest.fn().mockResolvedValue(null),
    findLastSibling: jest.fn().mockResolvedValue({ getOrderIndex: () => 7 }),
    save: jest.fn(),
  };

  const handler = new RestorePageDatabaseHandler(
    pageBlockRepo as unknown as PageBlockRepository,
    {
      findById: jest.fn().mockResolvedValue({ getPageId: () => 'page-1' }),
    } as unknown as DatabaseRepository,
    {
      runInTransaction: (fn: (context: unknown) => Promise<unknown>) =>
        fn('ctx'),
    } as unknown as UnitOfWork,
  );

  return { handler, pageBlockRepo };
}

describe('RestorePageDatabaseHandler', () => {
  it('restores the latest deleted block at the page root when its parent is still deleted', async () => {
    const latest = databaseBlock(
      'b-new',
      'db-1',
      new Date('2026-10-20'),
      'toggle-1',
    );
    const { handler, pageBlockRepo } = setup([
      latest,
      databaseBlock('b-old', 'db-1', new Date('2026-10-01')),
    ]);

    await handler.execute(new RestorePageDatabaseCommand('page-1', 'db-1'));

    expect(pageBlockRepo.save).toHaveBeenCalledWith(latest, 'ctx');
    expect(latest.getDeletedAt()).toBeNull();
    expect(latest.getParentBlockId()).toBeNull();
    expect(latest.getOrderIndex()).toBe(8);
  });

  it('refuses a database that a live block still shows', async () => {
    const { handler } = setup([databaseBlock('b-live', 'db-1', null)]);

    await expect(
      handler.execute(new RestorePageDatabaseCommand('page-1', 'db-1')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
