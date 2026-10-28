import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageActivityRecorder } from 'src/modules/content/application/ports/page-activity-recorder.port';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import type { AiPageContextTransactionLocker } from '../../services/ai-page-context-transaction-lock.port';

import { UndoAiModificationPlanCommand } from './undo-ai-modification-plan.command';
import { UndoAiModificationPlanHandler } from './undo-ai-modification-plan.handler';

/** Kế hoạch xoá block (D5): undo restores exactly what one Apply deleted. */
describe('UndoAiModificationPlanHandler', () => {
  const context: PersistenceContext = { transaction: 'tx' };
  const appliedAt = new Date('2026-10-27T10:00:00.000Z');
  const now = new Date('2026-10-27T11:00:00.000Z');

  const block = (
    id: string,
    orderIndex: number,
    options: {
      parent?: string | null;
      deletedAt?: Date | null;
      deletedBy?: string | null;
    } = {},
  ) =>
    PageBlock.restore({
      id,
      pageId: 'page-1',
      parentBlockId: options.parent ?? null,
      type: PageBlockType.TEXT,
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
      deletedAt: options.deletedAt ?? null,
      deletedBy: options.deletedBy ?? null,
    });
  const atApply = { deletedAt: appliedAt, deletedBy: 'user-1' };

  let blocks: PageBlock[];
  let repo: Record<string, jest.Mock>;
  let generation: Record<string, jest.Mock>;
  let authorize: jest.Mock;
  let touch: jest.Mock;
  let record: jest.Mock;
  let handler: UndoAiModificationPlanHandler;

  const plan = (...blockIds: string[]) => ({
    schemaVersion: 1,
    type: 'AI_MODIFICATION_PLAN',
    pageId: 'page-1',
    status: 'PLAN_READY',
    summary: 'Xoá',
    operations: blockIds.map((blockId) => ({
      type: 'DELETE_BLOCK',
      blockId,
      text: blockId,
      childCount: 0,
    })),
  });

  beforeEach(() => {
    blocks = [
      block('a', 0),
      block('toggle', 1, atApply),
      block('child-1', 0, { parent: 'toggle', ...atApply }),
      block('child-2', 1, { parent: 'toggle', ...atApply }),
      // Deleted by hand the day before: never restored by this undo.
      block('older', 2, {
        deletedAt: new Date('2026-10-26T09:00:00Z'),
        deletedBy: 'user-1',
      }),
    ];
    const active = () => blocks.filter((item) => !item.getDeletedAt());
    repo = {
      findDeletedByWorkspace: jest.fn(() =>
        Promise.resolve(blocks.filter((item) => item.getDeletedAt())),
      ),
      findById: jest.fn((id: string) =>
        Promise.resolve(active().find((item) => item.getId() === id) ?? null),
      ),
      findActiveSiblings: jest.fn((_page: string, parent: string | null) =>
        Promise.resolve(
          active().filter((item) => item.getParentBlockId() === parent),
        ),
      ),
      shiftSiblingOrderIndexes: jest.fn(() => Promise.resolve()),
      save: jest.fn((item: PageBlock) => Promise.resolve(item)),
      saveMany: jest.fn((items: PageBlock[]) => Promise.resolve(items)),
    };
    generation = {
      getCapability: jest.fn(() => 'GENERATE_PAGE_MODIFICATION_PLAN'),
      getStatus: jest.fn(() => AiGenerationStatus.APPLIED),
      getAppliedAt: jest.fn(() => appliedAt),
      getOutputData: jest.fn(() => plan('toggle')),
      getWorkspaceId: jest.fn(() => 'workspace-1'),
    };
    authorize = jest.fn(() => Promise.resolve(true));
    touch = jest.fn(() => Promise.resolve());
    record = jest.fn(() => Promise.resolve());
    handler = new UndoAiModificationPlanHandler(
      {
        findByIdAndUserIdForUpdate: jest.fn(() => Promise.resolve(generation)),
      } as unknown as AiGenerationRepository,
      { authorize } as unknown as AuthorizationService,
      repo as unknown as PageBlockRepository,
      { touch } as unknown as PageRepository,
      {
        runInTransaction: (fn: (ctx: PersistenceContext) => unknown) =>
          fn(context),
      } as unknown as UnitOfWork,
      {
        lock: jest.fn(() => Promise.resolve()),
      } as unknown as AiPageContextTransactionLocker,
      { record } as unknown as PageActivityRecorder,
    );
  });

  const undo = (shareToken?: string) =>
    handler.execute(
      new UndoAiModificationPlanCommand('user-1', 'generation-1', shareToken),
      now,
    );

  it('restores the deleted toggle and its nested blocks, nothing else', async () => {
    expect(await undo('share-token')).toEqual({
      restoredBlockIds: ['toggle', 'child-1', 'child-2'],
    });
    expect(
      blocks.filter((item) => item.getDeletedAt()).map((item) => item.getId()),
    ).toEqual(['older']);
    expect(authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_BLOCK_DELETE],
      target: { type: 'page', id: 'page-1' },
      shareToken: 'share-token',
    });
    expect(touch).toHaveBeenCalledWith('page-1', context);
    // Restored blocks count as created (kế hoạch ghi activity A4).
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        pageId: 'page-1',
        action: 'PAGE_BLOCK_CREATED',
        kind: 'RESTORED',
      }),
      context,
    );
    expect(repo.shiftSiblingOrderIndexes).not.toHaveBeenCalled();
  });

  it('moves later blocks down when a new block took the old place', async () => {
    blocks.push(block('inserted', 1));

    await undo();

    expect(repo.shiftSiblingOrderIndexes).toHaveBeenCalledWith(
      'page-1',
      null,
      1,
      context,
    );
  });

  it('is harmless when run twice', async () => {
    await undo();
    expect(await undo()).toEqual({ restoredBlockIds: [] });
  });

  it('leaves blocks another user deleted at the same moment', async () => {
    blocks[1] = block('toggle', 1, {
      deletedAt: appliedAt,
      deletedBy: 'user-2',
    });
    expect(await undo()).toEqual({ restoredBlockIds: [] });
    expect(touch).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it('refuses when the block it was inside is deleted', async () => {
    generation.getOutputData.mockReturnValue(plan('child-1'));
    await expect(undo()).rejects.toBeInstanceOf(ConflictException);
  });

  it.each([
    [
      'after 24 hours',
      () =>
        generation.getAppliedAt.mockReturnValue(
          new Date('2026-10-26T10:59:00Z'),
        ),
    ],
    [
      'for a draft that was not applied',
      () => generation.getStatus.mockReturnValue(AiGenerationStatus.COMPLETED),
    ],
    [
      'for a draft that deleted nothing',
      () =>
        generation.getOutputData.mockReturnValue({
          ...plan(),
          operations: [
            {
              type: 'SET_BLOCK_TEXT',
              blockId: 'a',
              oldText: 'a',
              newText: 'b',
            },
          ],
        }),
    ],
    [
      'for another capability',
      () => generation.getCapability.mockReturnValue('writing.improve'),
    ],
  ])('refuses %s', async (_name, arrange) => {
    arrange();
    await expect(undo()).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('refuses without block delete permission', async () => {
    authorize.mockResolvedValue(false);
    await expect(undo()).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('refuses an unknown generation', async () => {
    handler = new UndoAiModificationPlanHandler(
      {
        findByIdAndUserIdForUpdate: jest.fn(() => Promise.resolve(null)),
      } as unknown as AiGenerationRepository,
      { authorize } as unknown as AuthorizationService,
      repo as unknown as PageBlockRepository,
      { touch } as unknown as PageRepository,
      {
        runInTransaction: (fn: (ctx: PersistenceContext) => unknown) =>
          fn(context),
      } as unknown as UnitOfWork,
      { lock: jest.fn() } as unknown as AiPageContextTransactionLocker,
      { record } as unknown as PageActivityRecorder,
    );
    await expect(undo()).rejects.toBeInstanceOf(NotFoundException);
  });
});
