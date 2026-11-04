import { NotFoundException } from '@nestjs/common';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { DuplicatePageBlockCommand } from './duplicate-page-block.command';
import { DuplicatePageBlockHandler } from './duplicate-page-block.handler';

function blockParams(
  id: string,
  type: PageBlockType,
  parentBlockId: string | null,
  orderIndex: number,
) {
  return {
    id,
    pageId: 'page-1',
    parentBlockId,
    type,
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
    isOpen: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  };
}

function block(
  id: string,
  type: PageBlockType,
  parentBlockId: string | null,
  orderIndex: number,
): PageBlock {
  return PageBlock.restore(blockParams(id, type, parentBlockId, orderIndex));
}

const toggleParams = () => blockParams('toggle', PageBlockType.TEXT, null, 2);

// toggle > (a, b > c), plus sibling x after toggle
const toggle = block('toggle', PageBlockType.TOGGLE, null, 2);
const sibling = block('x', PageBlockType.TEXT, null, 3);
const a = block('a', PageBlockType.TEXT, 'toggle', 0);
const b = block('b', PageBlockType.TOGGLE, 'toggle', 1);
const c = block('c', PageBlockType.TEXT, 'b', 0);

function setup(source: PageBlock | null) {
  const pageBlockRepo = {
    findById: jest.fn().mockResolvedValue(source),
    findByPageId: jest.fn().mockResolvedValue([toggle, sibling, a, b, c]),
    shiftSiblingOrderIndexes: jest.fn(),
    save: jest.fn((saved: PageBlock) => Promise.resolve(saved)),
  };

  const handler = new DuplicatePageBlockHandler(
    pageBlockRepo as unknown as PageBlockRepository,
    {
      runInTransaction: (fn: (context: unknown) => Promise<unknown>) =>
        fn('ctx'),
    } as unknown as UnitOfWork,
  );

  return { handler, pageBlockRepo };
}

function savedBlocks(save: jest.Mock): PageBlock[] {
  return save.mock.calls.map(([saved]) => saved as PageBlock);
}

describe('DuplicatePageBlockHandler', () => {
  it('copies the block with its whole subtree right after the source', async () => {
    const { handler, pageBlockRepo } = setup(toggle);

    const result = await handler.execute(
      new DuplicatePageBlockCommand('toggle', 'user-2'),
    );

    expect(pageBlockRepo.shiftSiblingOrderIndexes).toHaveBeenCalledWith(
      'page-1',
      null,
      null,
      3,
      'ctx',
    );

    const saved = savedBlocks(pageBlockRepo.save);
    const [toggleCopy, aCopy, bCopy, cCopy] = saved;

    expect(saved).toHaveLength(4);
    expect(saved.map((s) => s.getContent())).toEqual([
      { text: 'toggle' },
      { text: 'a' },
      { text: 'b' },
      { text: 'c' },
    ]);

    expect(toggleCopy.getParentBlockId()).toBeNull();
    expect(toggleCopy.getOrderIndex()).toBe(3);
    expect(toggleCopy.getIsOpen()).toBe(false);
    expect(aCopy.getParentBlockId()).toBe(toggleCopy.getId());
    expect(aCopy.getOrderIndex()).toBe(0);
    expect(bCopy.getParentBlockId()).toBe(toggleCopy.getId());
    expect(bCopy.getOrderIndex()).toBe(1);
    expect(cCopy.getParentBlockId()).toBe(bCopy.getId());

    const sourceIds = ['toggle', 'x', 'a', 'b', 'c'];
    expect(saved.every((s) => !sourceIds.includes(s.getId()))).toBe(true);
    expect(saved.every((s) => s.getCreatedBy() === 'user-2')).toBe(true);

    expect(result.id).toBe(toggleCopy.getId());
  });

  it('does not share content objects with the source block', async () => {
    const { handler, pageBlockRepo } = setup(toggle);

    await handler.execute(new DuplicatePageBlockCommand('toggle', 'user-2'));

    const [toggleCopy] = savedBlocks(pageBlockRepo.save);

    expect(toggleCopy.getContent()).not.toBe(toggle.getContent());
  });

  it('keeps a copy of a task block inside that task', async () => {
    const taskBlock = PageBlock.restore({
      ...toggleParams(),
      id: 'task-text',
      rowId: 'row-1',
    });
    const { handler, pageBlockRepo } = setup(taskBlock);
    const findByRowId = jest.fn().mockResolvedValue([taskBlock]);
    Object.assign(pageBlockRepo, { findByRowId });

    await handler.execute(new DuplicatePageBlockCommand('task-text', 'user-2'));

    expect(findByRowId).toHaveBeenCalledWith('row-1', 'ctx');
    expect(pageBlockRepo.findByPageId).not.toHaveBeenCalled();
    expect(pageBlockRepo.shiftSiblingOrderIndexes).toHaveBeenCalledWith(
      'page-1',
      'row-1',
      null,
      3,
      'ctx',
    );
    expect(savedBlocks(pageBlockRepo.save)[0].getRowId()).toBe('row-1');
  });

  it('throws when the block does not exist', async () => {
    const { handler, pageBlockRepo } = setup(null);

    await expect(
      handler.execute(new DuplicatePageBlockCommand('missing', 'user-2')),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(pageBlockRepo.save).not.toHaveBeenCalled();
  });
});
