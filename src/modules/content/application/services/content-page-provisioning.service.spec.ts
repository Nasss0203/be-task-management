import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { CreateDatabaseViewHandler } from 'src/modules/database/application/commands/create-database-view/create-database-view.handler';
import type { CreateDatabaseHandler } from 'src/modules/database/application/commands/create-database/create-database.handler';
import type {
  DatabaseProvisioningPort,
  ProvisionDatabasesInput,
} from 'src/modules/database/application/ports/database-provisioning.port';
import { getPagePreset } from 'src/modules/content/application/services/page-presets';
import { PagePreset } from 'src/modules/content/domain/enums/page-preset.enum';
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
      { provisionDatabases: jest.fn() } as unknown as DatabaseProvisioningPort,
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

describe('ContentPageProvisioningService.createBlocksFromSnapshot', () => {
  const setup = (provisionDatabases: jest.Mock) => {
    const savedBlocks: PageBlock[] = [];
    const service = new ContentPageProvisioningService(
      {} as PageRepository,
      {
        saveMany: jest.fn((blocks: PageBlock[]) => {
          savedBlocks.push(...blocks);
          return Promise.resolve(blocks);
        }),
      } as unknown as PageBlockRepository,
      {} as UnitOfWork,
      {} as PublicSubdomainAllocatorService,
      {} as CreateDatabaseHandler,
      {} as CreateDatabaseViewHandler,
      { provisionDatabases } as unknown as DatabaseProvisioningPort,
    );
    return { service, savedBlocks };
  };

  it('creates the preset database and links it in a block after the text blocks', async () => {
    const provisionDatabases = jest
      .fn<Promise<unknown>, [ProvisionDatabasesInput, unknown]>()
      .mockResolvedValue({
        databaseIdMap: new Map([['database', 'live-database']]),
        viewIdMap: new Map([['view:0', 'live-view']]),
      });
    const { service, savedBlocks } = setup(provisionDatabases);
    const preset = getPagePreset(PagePreset.TASKS);
    const context = {};

    await service.createBlocksFromSnapshot(
      {
        pageId: 'page',
        createdBy: 'user',
        blocks: preset.blocks,
        database: preset.database,
      },
      context as never,
    );

    const [input, usedContext] = provisionDatabases.mock.calls[0];
    expect(usedContext).toBe(context);
    expect(input.pageId).toBe('page');
    expect(input.databases[0].name).toBe('Tasks');
    const table = savedBlocks.at(-1);
    expect(savedBlocks).toHaveLength(preset.blocks.length + 1);
    expect(table?.getType()).toBe(PageBlockType.DATABASE_VIEW);
    expect(table?.getOrderIndex()).toBe(preset.blocks.length);
    expect(table?.getDataConfig()).toEqual({
      database_id: 'live-database',
      view_id: 'live-view',
    });
  });

  it('does not create a database when the preset has none', async () => {
    const provisionDatabases = jest.fn();
    const { service, savedBlocks } = setup(provisionDatabases);
    const preset = getPagePreset(PagePreset.TODO_LIST);

    await service.createBlocksFromSnapshot(
      {
        pageId: 'page',
        createdBy: 'user',
        blocks: preset.blocks,
        database: preset.database,
      },
      {} as never,
    );

    expect(provisionDatabases).not.toHaveBeenCalled();
    expect(savedBlocks).toHaveLength(preset.blocks.length);
  });

  it('saves no blocks when creating the database fails', async () => {
    const provisionDatabases = jest
      .fn()
      .mockRejectedValue(new Error('database failed'));
    const { service, savedBlocks } = setup(provisionDatabases);
    const preset = getPagePreset(PagePreset.TASKS);

    await expect(
      service.createBlocksFromSnapshot(
        {
          pageId: 'page',
          createdBy: 'user',
          blocks: preset.blocks,
          database: preset.database,
        },
        {} as never,
      ),
    ).rejects.toThrow('database failed');
    expect(savedBlocks).toHaveLength(0);
  });
});
