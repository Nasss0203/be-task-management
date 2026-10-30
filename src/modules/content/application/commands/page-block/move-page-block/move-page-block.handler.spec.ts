import { PageBlockColumnCleanupService } from 'src/modules/content/application/services/page-block-column-cleanup.service';
import { PageBlockOrderingService } from 'src/modules/content/application/services/page-block-ordering.service';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { MovePageBlockCommand } from './move-page-block.command';
import { MovePageBlockHandler } from './move-page-block.handler';

/**
 * In-memory blocks that refuse two active siblings with the same order_index,
 * like the database's partial unique indexes do.
 */
function strictRepo(blocks: PageBlock[]) {
  const byId = new Map(blocks.map((block) => [block.getId(), block]));
  const active = () =>
    [...byId.values()].filter((block) => block.getDeletedAt() === null);
  const sorted = (list: PageBlock[]) =>
    list.sort((a, b) => a.getOrderIndex() - b.getOrderIndex());
  const store = (block: PageBlock) => {
    const clash = active().find(
      (other) =>
        other.getId() !== block.getId() &&
        block.getDeletedAt() === null &&
        other.getParentBlockId() === block.getParentBlockId() &&
        other.getOrderIndex() === block.getOrderIndex(),
    );
    if (clash) {
      throw new Error(
        `duplicate order_index ${block.getOrderIndex()} under ${block.getParentBlockId()}`,
      );
    }
    byId.set(block.getId(), block);
    return block;
  };

  return {
    findById: (id: string) => Promise.resolve(byId.get(id) ?? null),
    findActiveChildren: (parentId: string) =>
      Promise.resolve(
        sorted(active().filter((b) => b.getParentBlockId() === parentId)),
      ),
    findActiveSiblings: (_page: string, _row: null, parentId: string | null) =>
      Promise.resolve(
        sorted(active().filter((b) => b.getParentBlockId() === parentId)),
      ),
    save: (block: PageBlock) => Promise.resolve(store(block)),
    saveMany: (list: PageBlock[]) => Promise.resolve(list.map(store)),
    order: (parentId: string | null) =>
      sorted(active().filter((b) => b.getParentBlockId() === parentId)).map(
        (b) => b.getId(),
      ),
  };
}

const block = (
  id: string,
  order: number,
  parentBlockId: string | null = null,
  type = PageBlockType.TEXT,
) =>
  PageBlock.restore({
    id,
    pageId: 'page-1',
    parentBlockId,
    type,
    title: null,
    positionX: null,
    positionY: null,
    width: null,
    height: null,
    orderIndex: order,
    content: null,
    styleConfig: null,
    dataConfig: null,
    createdBy: 'user-1',
    isOpen: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  });

describe('MovePageBlockHandler across parents', () => {
  it('moves a block out of many siblings without order_index clashes', async () => {
    // Ten root blocks: renumbering them used to reuse the moved block's parked order.
    const roots = Array.from({ length: 10 }, (_, i) => block(`r${i}`, i));
    const repo = strictRepo([
      ...roots,
      block('toggle', 10, null, PageBlockType.TOGGLE),
      block('child', 0, 'toggle'),
    ]);
    const typed = repo as unknown as PageBlockRepository;
    const ordering = new PageBlockOrderingService(typed);
    const handler = new MovePageBlockHandler(
      typed,
      {
        runInTransaction: (fn: (context: unknown) => Promise<unknown>) =>
          fn('ctx'),
      } as unknown as UnitOfWork,
      ordering,
      new PageBlockColumnCleanupService(typed, ordering),
    );

    await handler.execute(
      new MovePageBlockCommand(
        'r6',
        { target_parent_block_id: 'toggle', target_order_index: 1 },
        'user-2',
      ),
    );

    expect(repo.order('toggle')).toEqual(['child', 'r6']);
    expect(repo.order(null)).toEqual([
      'r0',
      'r1',
      'r2',
      'r3',
      'r4',
      'r5',
      'r7',
      'r8',
      'r9',
      'toggle',
    ]);
  });
});
