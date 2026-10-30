import { BadRequestException } from '@nestjs/common';
import { PageBlockColumnCleanupService } from 'src/modules/content/application/services/page-block-column-cleanup.service';
import { PageBlockOrderingService } from 'src/modules/content/application/services/page-block-ordering.service';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { CreatePageBlockColumnsCommand } from './create-page-block-columns.command';
import { CreatePageBlockColumnsHandler } from './create-page-block-columns.handler';

/** Just enough of the block repository, in memory, to run the real ordering. */
function memoryRepo(blocks: PageBlock[]) {
  const byId = new Map(blocks.map((block) => [block.getId(), block]));
  const active = () =>
    [...byId.values()].filter((block) => block.getDeletedAt() === null);
  const sorted = (list: PageBlock[]) =>
    list.sort((a, b) => a.getOrderIndex() - b.getOrderIndex());
  const store = (block: PageBlock) => (byId.set(block.getId(), block), block);
  /** The live tree: `type:text` per block, children in brackets. */
  const tree = (parentId: string | null = null): string[] =>
    sorted(active().filter((b) => b.getParentBlockId() === parentId)).map(
      (b) => {
        const content = b.getContent() as { text?: string } | null;
        const label = `${b.getType()}:${content?.text ?? ''}`;
        const children = tree(b.getId());
        return children.length ? `${label}[${children.join(',')}]` : label;
      },
    );

  return {
    tree,
    findById: (id: string) => Promise.resolve(byId.get(id) ?? null),
    findActiveChildren: (parentId: string) =>
      Promise.resolve(
        sorted(active().filter((b) => b.getParentBlockId() === parentId)),
      ),
    findActiveSiblings: (
      pageId: string,
      rowId: string | null,
      parentId: string | null,
    ) =>
      Promise.resolve(
        sorted(
          active().filter(
            (b) =>
              b.getPageId() === pageId &&
              b.getRowId() === rowId &&
              b.getParentBlockId() === parentId,
          ),
        ),
      ),
    save: (block: PageBlock) => Promise.resolve(store(block)),
    saveMany: (list: PageBlock[]) => Promise.resolve(list.map(store)),
  };
}

const text = (id: string, order: number, parentBlockId: string | null = null) =>
  PageBlock.restore({
    id,
    pageId: 'page-1',
    parentBlockId,
    type: PageBlockType.TEXT,
    title: null,
    positionX: null,
    positionY: null,
    width: null,
    height: null,
    orderIndex: order,
    content: { text: id },
    styleConfig: null,
    dataConfig: null,
    createdBy: 'user-1',
    isOpen: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  });

function setup(blocks: PageBlock[]) {
  const repo = memoryRepo(blocks);
  const typed = repo as unknown as PageBlockRepository;
  const ordering = new PageBlockOrderingService(typed);
  const cleanup = new PageBlockColumnCleanupService(typed, ordering);
  const uow = {
    runInTransaction: (fn: (context: unknown) => Promise<unknown>) => fn('ctx'),
  } as unknown as UnitOfWork;
  return {
    repo,
    cleanup,
    handler: new CreatePageBlockColumnsHandler(typed, uow, ordering, cleanup),
  };
}

const columns = (ids: string[]) =>
  new CreatePageBlockColumnsCommand('page-1', ids, 'user-2');

describe('CreatePageBlockColumnsHandler', () => {
  it('puts the blocks side by side where the first one was', async () => {
    const { handler, repo } = setup([
      text('a', 0),
      text('b', 1),
      text('c', 2),
      text('d', 3),
    ]);

    await handler.execute(columns(['b', 'd']));

    expect(repo.tree()).toEqual([
      'TEXT:a',
      'COLUMN_LIST:[COLUMN:[TEXT:b],COLUMN:[TEXT:d]]',
      'TEXT:c',
    ]);
    const [, row] = await repo.findActiveSiblings('page-1', null, null);
    const widths = (await repo.findActiveChildren(row.getId())).map(
      (column) => column.getStyleConfig()?.width_ratio,
    );
    expect(widths).toEqual([0.5, 0.5]);
  });

  it('refuses a block beside the block that contains it', async () => {
    const { handler } = setup([text('t', 0), text('child', 0, 't')]);

    await expect(
      handler.execute(columns(['t', 'child'])),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('unwraps the row once a column is all that is left', async () => {
    const { handler, repo, cleanup } = setup([
      text('a', 0),
      text('b', 1),
      text('c', 2),
    ]);
    await handler.execute(columns(['b', 'c']));

    // Delete "c" the way DeletePageBlockHandler does, then tidy its column.
    const c = (await repo.findById('c'))!;
    c.markAsDeleted('user-2');
    await repo.save(c);
    await cleanup.tidy(c.getParentBlockId(), 'user-2');

    expect(repo.tree()).toEqual(['TEXT:a', 'TEXT:b']);
    expect((await repo.findById('b'))!.getParentBlockId()).toBeNull();
  });
});
