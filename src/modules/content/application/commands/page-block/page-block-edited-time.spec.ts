import { NotFoundException } from '@nestjs/common';

import { PageBlockOrderingService } from 'src/modules/content/application/services/page-block-ordering.service';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageActivityRecorder } from 'src/modules/content/application/ports/page-activity-recorder.port';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AddDatabaseViewToBlockCommand } from './add-database-view-to-block/add-database-view-to-block.command';
import { AddDatabaseViewToBlockHandler } from './add-database-view-to-block/add-database-view-to-block.handler';
import { CreatePageBlockCommand } from './create-page-block/create-page-block.command';
import { CreatePageBlockHandler } from './create-page-block/create-page-block.handler';
import { DeletePageBlockCommand } from './delete-page-block/delete-page-block.command';
import { DeletePageBlockHandler } from './delete-page-block/delete-page-block.handler';
import { MovePageBlockCommand } from './move-page-block/move-page-block.command';
import { MovePageBlockHandler } from './move-page-block/move-page-block.handler';
import { ReorderPageBlockCommand } from './reorder-page-block/reorder-page-block.command';
import { ReorderPageBlockHandler } from './reorder-page-block/reorder-page-block.handler';
import { RestorePageBlockCommand } from './restore-page-block/restore-page-block.command';
import { RestorePageBlockHandler } from './restore-page-block/restore-page-block.handler';
import { UpdatePageBlockCommand } from './update-page-block/update-page-block.command';
import { UpdatePageBlockHandler } from './update-page-block/update-page-block.handler';

/** Every manual block change marks its Page edited ("Edited …"). */
describe('page block commands mark the Page edited', () => {
  const context: PersistenceContext = { transaction: 'tx' };

  const block = (
    id: string,
    orderIndex: number,
    overrides: { type?: PageBlockType; deletedAt?: Date | null } = {},
  ) =>
    PageBlock.restore({
      id,
      pageId: 'page-1',
      parentBlockId: null,
      type: overrides.type ?? PageBlockType.TEXT,
      title: null,
      positionX: null,
      positionY: null,
      width: null,
      height: null,
      orderIndex,
      content: { text: id },
      styleConfig: {},
      dataConfig: {},
      createdBy: 'user-1',
      isOpen: true,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      deletedAt: overrides.deletedAt ?? null,
      deletedBy: null,
    });

  let blocks: PageBlock[];
  let repo: Record<string, jest.Mock>;
  let pageRepository: { touch: jest.Mock };
  let activity: { record: jest.Mock };
  let uow: UnitOfWork;

  beforeEach(() => {
    blocks = [block('a', 0), block('b', 1)];
    const active = () => blocks.filter((item) => !item.getDeletedAt());
    repo = {
      findById: jest.fn((id: string) =>
        Promise.resolve(active().find((item) => item.getId() === id) ?? null),
      ),
      findDeletedById: jest.fn((id: string) =>
        Promise.resolve(
          blocks.find((item) => item.getId() === id && item.getDeletedAt()) ??
            null,
        ),
      ),
      findActiveChildren: jest.fn(() => Promise.resolve([])),
      findActiveSiblings: jest.fn(() => Promise.resolve(active())),
      findLastSibling: jest.fn(() => Promise.resolve(active().at(-1) ?? null)),
      shiftSiblingOrderIndexes: jest.fn(() => Promise.resolve()),
      save: jest.fn((item: PageBlock) => Promise.resolve(item)),
      saveMany: jest.fn((items: PageBlock[]) => Promise.resolve(items)),
    };
    pageRepository = { touch: jest.fn(() => Promise.resolve()) };
    activity = { record: jest.fn(() => Promise.resolve()) };
    uow = {
      runInTransaction: jest.fn(
        (fn: (context: PersistenceContext) => Promise<unknown>) => fn(context),
      ),
    } as unknown as UnitOfWork;
  });

  const blockRepo = () => repo as unknown as PageBlockRepository;
  const pages = () => pageRepository as unknown as PageRepository;
  const ordering = () => new PageBlockOrderingService(blockRepo());
  const recorder = () => activity as unknown as PageActivityRecorder;

  // kế hoạch ghi activity A3: what each command records.
  const recorded: Record<string, string> = {
    create: 'PAGE_BLOCK_CREATED',
    update: 'PAGE_BLOCK_UPDATED',
    delete: 'PAGE_BLOCK_DELETED',
    restore: 'PAGE_BLOCK_CREATED',
    move: 'PAGE_BLOCK_REORDERED',
    reorder: 'PAGE_BLOCK_REORDERED',
  };

  it.each([
    [
      'create',
      () =>
        new CreatePageBlockHandler(blockRepo(), uow, pages(), recorder()).execute(
          new CreatePageBlockCommand({
            pageId: 'page-1',
            type: PageBlockType.TEXT,
            createdBy: 'user-1',
            content: { text: 'new' },
          }),
        ),
    ],
    [
      'update',
      () =>
        new UpdatePageBlockHandler(blockRepo(), uow, pages(), recorder()).execute(
          new UpdatePageBlockCommand(
            'a',
            { content: { text: 'edited' } },
            'user-1',
          ),
        ),
    ],
    [
      'delete',
      () =>
        new DeletePageBlockHandler(blockRepo(), uow, pages(), recorder()).execute(
          new DeletePageBlockCommand('a', 'user-1'),
        ),
    ],
    [
      'restore',
      () => {
        blocks.push(block('gone', 2, { deletedAt: new Date(0) }));
        return new RestorePageBlockHandler(blockRepo(), uow, pages(), recorder()).execute(
          new RestorePageBlockCommand('gone', 'user-1'),
        );
      },
    ],
    [
      'move',
      () =>
        new MovePageBlockHandler(
          blockRepo(),
          uow,
          ordering(),
          pages(),
          recorder(),
        ).execute(
          new MovePageBlockCommand('b', {
            target_parent_block_id: null,
            target_order_index: 0,
          }, 'user-1'),
        ),
    ],
    [
      'reorder',
      () =>
        new ReorderPageBlockHandler(
          blockRepo(),
          uow,
          ordering(),
          pages(),
          recorder(),
        ).execute(
          new ReorderPageBlockCommand({
            page_id: 'page-1',
            parent_block_id: null,
            items: [
              { id: 'a', order_index: 1 },
              { id: 'b', order_index: 0 },
            ],
          }, 'user-1'),
        ),
    ],
    [
      'add a database view',
      () => {
        blocks.push(block('view', 2, { type: PageBlockType.DATABASE_VIEW }));
        return new AddDatabaseViewToBlockHandler(
          blockRepo(),
          uow,
          pages(),
          recorder(),
        ).execute(
          new AddDatabaseViewToBlockCommand('view', {
            database_id: 'database-1',
            view_id: 'view-1',
          }, 'user-1'),
        );
      },
    ],
  ])('%s marks the Page edited inside its transaction', async (_name, run) => {
    await run();

    expect(pageRepository.touch).toHaveBeenCalledTimes(1);
    expect(pageRepository.touch).toHaveBeenCalledWith('page-1', context);
    // The same transaction records who edited the Page.
    expect(activity.record).toHaveBeenCalledTimes(1);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        pageId: 'page-1',
        action: recorded[_name] ?? 'PAGE_BLOCK_CREATED',
      }),
      context,
    );
  });

  it('does not mark the Page edited when the change fails', async () => {
    await expect(
      new UpdatePageBlockHandler(blockRepo(), uow, pages(), recorder()).execute(
        new UpdatePageBlockCommand('missing', { content: { text: 'x' } }),
      ),
    ).rejects.toThrow(NotFoundException);
    expect(pageRepository.touch).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });
});
