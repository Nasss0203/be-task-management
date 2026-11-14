import { BadRequestException } from '@nestjs/common';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { PageBlockFormService } from 'src/modules/content/application/services/page-block-form.service';
import type { PageBlockMentionService } from 'src/modules/content/application/services/page-block-mention.service';
import { UpdatePageBlockCommand } from './update-page-block.command';
import { UpdatePageBlockHandler } from './update-page-block.handler';

describe('UpdatePageBlockHandler for database views', () => {
  const setup = () => {
    const block = PageBlock.restore({
      id: 'block',
      pageId: 'page',
      parentBlockId: null,
      type: PageBlockType.DATABASE_VIEW,
      title: null,
      positionX: null,
      positionY: null,
      width: null,
      height: null,
      orderIndex: 0,
      content: null,
      styleConfig: null,
      dataConfig: { database_id: 'db', view_id: 'table' },
      createdBy: 'owner',
      isOpen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
    });
    const repo = {
      findById: jest.fn().mockResolvedValue(block),
      save: jest.fn((saved: PageBlock) => Promise.resolve(saved)),
    };
    const mentions = { afterSave: jest.fn() };
    const handler = new UpdatePageBlockHandler(
      repo as unknown as PageBlockRepository,
      {
        runInTransaction: (work: (context: unknown) => unknown) => work({}),
      } as unknown as UnitOfWork,
      { touch: jest.fn() } as never,
      { record: jest.fn() } as never,
      {} as PageBlockFormService,
      mentions as unknown as PageBlockMentionService,
    );

    return { handler, repo, mentions };
  };

  it('saves another view of the same database as the default', async () => {
    const { handler } = setup();

    const result = await handler.execute(
      new UpdatePageBlockCommand(
        'block',
        { dataConfig: { database_id: 'db', view_id: 'board' } },
        'owner',
      ),
    );

    expect(result.data_config).toEqual({ database_id: 'db', view_id: 'board' });
  });

  it('refuses to point the block at another database', async () => {
    const { handler, repo } = setup();

    await expect(
      handler.execute(
        new UpdatePageBlockCommand(
          'block',
          { dataConfig: { database_id: 'other', view_id: 'x' } },
          'owner',
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

describe('UpdatePageBlockHandler mentions', () => {
  const setup = () => {
    const block = PageBlock.create({
      pageId: 'page',
      rowId: null,
      parentBlockId: null,
      type: PageBlockType.TEXT,
      orderIndex: 0,
      content: { text: 'hi' },
      createdBy: 'owner',
    });
    const repo = {
      findById: jest.fn().mockResolvedValue(block),
      save: jest.fn((saved: PageBlock) => Promise.resolve(saved)),
    };
    const mentions = { afterSave: jest.fn() };
    const handler = new UpdatePageBlockHandler(
      repo as unknown as PageBlockRepository,
      {
        runInTransaction: (work: (context: unknown) => unknown) => work({}),
      } as unknown as UnitOfWork,
      { touch: jest.fn() } as never,
      { record: jest.fn() } as never,
      {} as PageBlockFormService,
      mentions as unknown as PageBlockMentionService,
    );

    return { handler, block, mentions };
  };

  it('syncs mentions with the saved text after the transaction', async () => {
    const { handler, block, mentions } = setup();

    await handler.execute(
      new UpdatePageBlockCommand(
        block.getId(),
        {
          content: {
            text: 'hi @[Lan](user:11111111-1111-4111-8111-111111111111)',
          },
        },
        'owner',
      ),
    );

    expect(mentions.afterSave).toHaveBeenCalledTimes(1);
    expect(mentions.afterSave).toHaveBeenCalledWith(block, 'owner');
    expect(block.getContent()).toEqual({
      text: 'hi @[Lan](user:11111111-1111-4111-8111-111111111111)',
    });
  });

  it('leaves mentions alone when the text did not change', async () => {
    const { handler, block, mentions } = setup();

    await handler.execute(
      new UpdatePageBlockCommand(block.getId(), { isOpen: false }, 'owner'),
    );

    expect(mentions.afterSave).not.toHaveBeenCalled();
  });
});
