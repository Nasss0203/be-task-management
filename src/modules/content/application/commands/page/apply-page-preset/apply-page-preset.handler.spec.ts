import type { CreatePageBlocksFromSnapshotInput } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { PagePreset } from 'src/modules/content/domain/enums/page-preset.enum';
import { ApplyPagePresetCommand } from './apply-page-preset.command';
import { ApplyPagePresetHandler } from './apply-page-preset.handler';

describe('ApplyPagePresetHandler', () => {
  const context = {};
  const existingBlock = { markAsDeleted: jest.fn() };
  const pageBlockRepo = {
    findByPageId: jest.fn().mockResolvedValue([existingBlock]),
    saveMany: jest.fn().mockResolvedValue([]),
  };
  const pageProvisioning = {
    createBlocksFromSnapshot: jest
      .fn<Promise<void>, [CreatePageBlocksFromSnapshotInput, unknown]>()
      .mockResolvedValue(undefined),
  };
  const uow = {
    runInTransaction: jest.fn((work: (ctx: unknown) => Promise<void>) =>
      work(context),
    ),
  };

  const handler = new ApplyPagePresetHandler(
    pageBlockRepo as never,
    pageProvisioning as never,
    uow as never,
    { record: jest.fn(() => Promise.resolve()) } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('replaces existing blocks with the preset blocks', async () => {
    await handler.execute(
      new ApplyPagePresetCommand('page-1', PagePreset.TODO_LIST, 'user-1'),
    );

    expect(existingBlock.markAsDeleted).toHaveBeenCalledWith('user-1');
    expect(pageBlockRepo.saveMany).toHaveBeenCalledWith(
      [existingBlock],
      context,
    );
    const [input] = pageProvisioning.createBlocksFromSnapshot.mock.calls[0];
    expect(input.pageId).toBe('page-1');
    expect(input.blocks.length).toBeGreaterThan(0);
  });

  it('only clears blocks for the empty preset', async () => {
    await handler.execute(
      new ApplyPagePresetCommand('page-1', PagePreset.EMPTY, 'user-1'),
    );

    expect(existingBlock.markAsDeleted).toHaveBeenCalled();
    const [input] = pageProvisioning.createBlocksFromSnapshot.mock.calls[0];
    expect(input.blocks).toEqual([]);
  });
});
