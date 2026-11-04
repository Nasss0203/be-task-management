import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { CreateDatabaseViewHandler } from 'src/modules/database/application/commands/create-database-view/create-database-view.handler';
import type { CreateDatabaseHandler } from 'src/modules/database/application/commands/create-database/create-database.handler';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { ContentPageProvisioningService } from './content-page-provisioning.service';
import type { PublicSubdomainAllocatorService } from './public-subdomain-allocator.service';

describe('ContentPageProvisioningService.createDefaultPage', () => {
  it('starts with the guide and a table linked to a database', async () => {
    const savedBlocks: PageBlock[] = [];
    const service = new ContentPageProvisioningService(
      {
        lockWorkspaceHierarchy: jest.fn(),
        save: jest.fn((page: unknown) => Promise.resolve(page)),
      } as unknown as PageRepository,
      {
        saveMany: jest.fn((blocks: PageBlock[]) => {
          savedBlocks.push(...blocks);
          return Promise.resolve(blocks);
        }),
      } as unknown as PageBlockRepository,
      {} as UnitOfWork,
      {
        allocate: jest.fn().mockResolvedValue('home'),
      } as unknown as PublicSubdomainAllocatorService,
      {
        execute: jest.fn().mockResolvedValue({ getId: () => 'database' }),
      } as unknown as CreateDatabaseHandler,
      {
        execute: jest.fn().mockResolvedValue({ id: 'view' }),
      } as unknown as CreateDatabaseViewHandler,
    );

    await service.createDefaultPage(
      {
        workspaceId: 'workspace',
        title: 'Task management',
        slug: 'task-management',
        createdBy: 'user',
      },
      {} as never,
    );

    const table = savedBlocks.at(-1);

    expect(savedBlocks[0].getType()).toBe(PageBlockType.CALLOUT);
    expect(
      savedBlocks.filter((block) => block.getType() === PageBlockType.TODO),
    ).toHaveLength(4);
    expect(table?.getType()).toBe(PageBlockType.DATABASE_VIEW);
    expect(table?.getOrderIndex()).toBe(savedBlocks.length - 1);
    expect(table?.getDataConfig()).toEqual({
      database_id: 'database',
      view_id: 'view',
    });
  });
});
