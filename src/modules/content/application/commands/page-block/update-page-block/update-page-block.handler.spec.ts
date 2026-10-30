import { BadRequestException } from '@nestjs/common';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { PageBlockFormService } from 'src/modules/content/application/services/page-block-form.service';
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
    const handler = new UpdatePageBlockHandler(
      repo as unknown as PageBlockRepository,
      {
        runInTransaction: (work: (context: unknown) => unknown) => work({}),
      } as unknown as UnitOfWork,
      {} as PageBlockFormService,
    );

    return { handler, repo };
  };

  it('saves another view of the same database as the default', async () => {
    const { handler } = setup();

    const result = await handler.execute(
      new UpdatePageBlockCommand('block', {
        dataConfig: { database_id: 'db', view_id: 'board' },
      }),
    );

    expect(result.data_config).toEqual({ database_id: 'db', view_id: 'board' });
  });

  it('refuses to point the block at another database', async () => {
    const { handler, repo } = setup();

    await expect(
      handler.execute(
        new UpdatePageBlockCommand('block', {
          dataConfig: { database_id: 'other', view_id: 'x' },
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
