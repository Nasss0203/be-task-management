import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { PagePreset } from 'src/modules/content/domain/enums/page-preset.enum';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { CreateDatabaseViewCommand } from 'src/modules/database/application/commands/create-database-view/create-database-view.command';
import { CreateDatabaseViewHandler } from 'src/modules/database/application/commands/create-database-view/create-database-view.handler';
import { CreateDatabaseCommand } from 'src/modules/database/application/commands/create-database/create-database.command';
import { CreateDatabaseHandler } from 'src/modules/database/application/commands/create-database/create-database.handler';
import type { DatabaseProvisioningPort } from 'src/modules/database/application/ports/database-provisioning.port';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import {
  ContentPageProvisioningPort,
  CreateDefaultPageInput,
  CreatePageBlockSnapshotInput,
  CreatePageBlocksFromSnapshotInput,
  CreatePageFromSnapshotInput,
  CreatePageShellInput,
  PresetDatabaseDefinition,
  ProvisionedPageResult,
} from '../ports/content-page-provisioning.port';
import { buildPresetDatabaseSnapshot, getPagePreset } from './page-presets';
import { PublicSubdomainAllocatorService } from './public-subdomain-allocator.service';

@Injectable()
export class ContentPageProvisioningService implements ContentPageProvisioningPort {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly subdomains: PublicSubdomainAllocatorService,
    private readonly createDatabase: CreateDatabaseHandler,
    private readonly createDatabaseView: CreateDatabaseViewHandler,
    @Inject(DATABASE_TYPES.ports.DatabaseProvisioning)
    private readonly databaseProvisioning: DatabaseProvisioningPort,
  ) {}

  async createDefaultPage(
    input: CreateDefaultPageInput,
    context?: PersistenceContext,
  ): Promise<void> {
    const create = async (manager: PersistenceContext) => {
      await this.pageRepo.lockWorkspaceHierarchy(input.workspaceId, manager);
      const preset = getPagePreset(PagePreset.GETTING_STARTED);
      const page = Page.create({
        workspaceId: input.workspaceId,
        title: input.title,
        createdBy: input.createdBy,
        slug: input.slug,
        publicSubdomain: await this.subdomains.allocate(
          input.slug ?? input.title,
          manager,
        ),
        icon: preset.icon,
        coverUrl: null,
      });

      const savedPage = await this.pageRepo.save(page, manager);

      const database = await this.createDatabase.execute(
        new CreateDatabaseCommand(savedPage.getId(), 'Tasks'),
        manager,
      );
      const view = await this.createDatabaseView.execute(
        new CreateDatabaseViewCommand(
          database.getId(),
          'Table',
          DatabaseViewType.TABLE,
        ),
        manager,
      );

      await this.createBlocksFromSnapshot(
        {
          pageId: savedPage.getId(),
          createdBy: savedPage.getCreatedBy(),
          blocks: [
            ...preset.blocks,
            {
              sourceId: 'default-tasks',
              type: PageBlockType.DATABASE_VIEW,
              title: 'Tasks',
              positionX: 0,
              positionY: 0,
              width: 12,
              height: 1,
              orderIndex: preset.blocks.length,
              dataConfig: { database_id: database.getId(), view_id: view.id },
            },
          ],
        },
        manager,
      );
    };
    if (context === undefined) await this.uow.runInTransaction(create);
    else await create(context);
  }

  async createPageFromSnapshot(
    input: CreatePageFromSnapshotInput,
    context?: PersistenceContext,
  ): Promise<ProvisionedPageResult> {
    const create = async (
      manager: PersistenceContext,
    ): Promise<ProvisionedPageResult> => {
      const result = await this.createPageShell(
        {
          workspaceId: input.workspaceId,
          title: input.title,
          createdBy: input.createdBy,
          slug: input.slug,
          icon: input.icon,
          coverUrl: input.coverUrl,
        },
        manager,
      );

      await this.createBlocksFromSnapshot(
        {
          pageId: result.pageId,
          createdBy: input.createdBy,
          blocks: input.blocks,
          database: input.database,
        },
        manager,
      );

      return result;
    };

    if (context === undefined) {
      return this.uow.runInTransaction(create);
    }

    return create(context);
  }

  async createPageShell(
    input: CreatePageShellInput,
    context?: PersistenceContext,
  ): Promise<ProvisionedPageResult> {
    const create = async (
      manager: PersistenceContext,
    ): Promise<ProvisionedPageResult> => {
      await this.pageRepo.lockWorkspaceHierarchy(input.workspaceId, manager);

      const page = Page.create({
        workspaceId: input.workspaceId,
        title: input.title,
        createdBy: input.createdBy,
        slug: input.slug,
        publicSubdomain: await this.subdomains.allocate(
          input.slug ?? input.title,
          manager,
        ),
        icon: input.icon ?? null,
        coverUrl: input.coverUrl ?? null,
      });

      await this.pageRepo.save(page, manager);

      return {
        pageId: page.getId(),
      };
    };

    if (context === undefined) {
      return this.uow.runInTransaction(create);
    }

    return create(context);
  }

  async createBlocksFromSnapshot(
    input: CreatePageBlocksFromSnapshotInput,
    context?: PersistenceContext,
  ): Promise<void> {
    const create = async (manager: PersistenceContext): Promise<void> => {
      const blocks = input.database
        ? [
            ...input.blocks,
            await this.createPresetDatabaseBlock(
              input.pageId,
              input.database,
              input.blocks.length,
              manager,
            ),
          ]
        : input.blocks;
      const sortedBlocks = this.sortSnapshotBlocks(blocks);

      const sourceIdToPageBlockId = new Map<string, string>();

      const pageBlocks: PageBlock[] = [];

      for (const inputBlock of sortedBlocks) {
        let parentBlockId: string | null = null;

        if (inputBlock.parentSourceId) {
          const mappedParentId = sourceIdToPageBlockId.get(
            inputBlock.parentSourceId,
          );

          if (!mappedParentId) {
            throw new BadRequestException(
              `Page block parent "${inputBlock.parentSourceId}" could not be resolved`,
            );
          }

          parentBlockId = mappedParentId;
        }

        const pageBlock = PageBlock.create({
          pageId: input.pageId,
          parentBlockId,

          type: inputBlock.type,
          title: inputBlock.title ?? null,

          positionX: inputBlock.positionX,
          positionY: inputBlock.positionY,
          width: inputBlock.width,
          height: inputBlock.height,

          orderIndex: inputBlock.orderIndex,

          content: inputBlock.content ?? null,
          styleConfig: inputBlock.styleConfig ?? null,
          dataConfig: inputBlock.dataConfig ?? null,

          createdBy: input.createdBy,
          isOpen: inputBlock.isOpen ?? true,
        });

        sourceIdToPageBlockId.set(inputBlock.sourceId, pageBlock.getId());

        pageBlocks.push(pageBlock);
      }

      await this.pageBlockRepo.saveMany(pageBlocks, manager);
    };

    if (context === undefined) {
      await this.uow.runInTransaction(create);
      return;
    }

    await create(context);
  }

  private async createPresetDatabaseBlock(
    pageId: string,
    definition: PresetDatabaseDefinition,
    orderIndex: number,
    manager: PersistenceContext,
  ): Promise<CreatePageBlockSnapshotInput> {
    const snapshot = buildPresetDatabaseSnapshot(
      definition,
      new Date().toISOString().slice(0, 10),
    );
    const result = await this.databaseProvisioning.provisionDatabases(
      { pageId, databases: [snapshot] },
      manager,
    );

    return {
      sourceId: 'preset-database',
      type: PageBlockType.DATABASE_VIEW,
      title: definition.name,
      positionX: 0,
      positionY: 0,
      width: 12,
      height: 1,
      orderIndex,
      dataConfig: {
        database_id: result.databaseIdMap.get(snapshot.sourceId),
        view_id: result.viewIdMap.get(snapshot.views[0].sourceId),
      },
    };
  }

  private sortSnapshotBlocks(
    blocks: CreatePageBlockSnapshotInput[],
  ): CreatePageBlockSnapshotInput[] {
    const bySourceId = new Map<string, CreatePageBlockSnapshotInput>();

    for (const block of blocks) {
      if (!block.sourceId?.trim()) {
        throw new BadRequestException('Page block sourceId is required');
      }

      if (bySourceId.has(block.sourceId)) {
        throw new BadRequestException(
          `Duplicate page block sourceId: ${block.sourceId}`,
        );
      }

      bySourceId.set(block.sourceId, block);
    }

    for (const block of blocks) {
      if (!block.parentSourceId) {
        continue;
      }

      if (block.parentSourceId === block.sourceId) {
        throw new BadRequestException(
          `Page block "${block.sourceId}" cannot be its own parent`,
        );
      }

      if (!bySourceId.has(block.parentSourceId)) {
        throw new BadRequestException(
          `Page block parent "${block.parentSourceId}" does not exist`,
        );
      }
    }

    const result: CreatePageBlockSnapshotInput[] = [];

    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (sourceId: string): void => {
      if (visited.has(sourceId)) {
        return;
      }

      if (visiting.has(sourceId)) {
        throw new BadRequestException('Page block hierarchy contains a cycle');
      }

      const block = bySourceId.get(sourceId);

      if (!block) {
        throw new BadRequestException(
          `Page block "${sourceId}" does not exist`,
        );
      }

      visiting.add(sourceId);

      if (block.parentSourceId) {
        visit(block.parentSourceId);
      }

      visiting.delete(sourceId);
      visited.add(sourceId);

      result.push(block);
    };

    for (const block of blocks) {
      visit(block.sourceId);
    }

    return result;
  }
}
