import { Inject, Injectable } from '@nestjs/common';

import { AddDatabaseViewToBlockCommand } from 'src/modules/content/application/commands/page-block/add-database-view-to-block/add-database-view-to-block.command';
import { AddDatabaseViewToBlockHandler } from 'src/modules/content/application/commands/page-block/add-database-view-to-block/add-database-view-to-block.handler';
import { CreatePageBlockCommand } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.command';
import { CreatePageBlockHandler } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.handler';
import { CreatePageCommand } from 'src/modules/content/application/commands/page/create-page/create-page.command';
import { CreatePageHandler } from 'src/modules/content/application/commands/page/create-page/create-page.handler';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

import { AddPropertyOptionCommand } from 'src/modules/database/application/commands/add-property-option/add-property-option.command';
import { AddPropertyOptionHandler } from 'src/modules/database/application/commands/add-property-option/add-property-option.handler';
import { AddPropertyCommand } from 'src/modules/database/application/commands/add-property/add-property.command';
import { AddPropertyHandler } from 'src/modules/database/application/commands/add-property/add-property.handler';
import { CreateDatabaseRowCommand } from 'src/modules/database/application/commands/create-database-row/create-database-row.command';
import { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import { CreateDatabaseCommand } from 'src/modules/database/application/commands/create-database/create-database.command';
import { CreateDatabaseHandler } from 'src/modules/database/application/commands/create-database/create-database.handler';
import { CreateDatabaseViewCommand } from 'src/modules/database/application/commands/create-database-view/create-database-view.command';
import { CreateDatabaseViewHandler } from 'src/modules/database/application/commands/create-database-view/create-database-view.handler';
import { RenamePropertyCommand } from 'src/modules/database/application/commands/rename-property/rename-property.command';
import { RenamePropertyHandler } from 'src/modules/database/application/commands/rename-property/rename-property.handler';
import { SetRowValueCommand } from 'src/modules/database/application/commands/set-row-value/set-row-value.command';
import { SetRowValueHandler } from 'src/modules/database/application/commands/set-row-value/set-row-value.handler';
import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type {
  PageCompositionBlockDraft,
  PageCompositionDatabaseDraft,
  PageCompositionDraft,
} from '../types/page-composition-draft';

export interface ExecutePageCompositionParams {
  userId: string;
  workspaceId: string;
  teamspaceId?: string | null;
  parentPageId?: string | null;
  draft: PageCompositionDraft;
}

export interface PageCompositionExecutionResult {
  pageId: string;
  blockIds: Record<string, string>;
  databaseIds: Record<string, string>;
  propertyIds: Record<string, string>;
  optionIds: Record<string, Record<string, string>>;
  viewIds: Record<string, Record<string, string>>;
  rowIds: Record<string, Record<string, string>>;
}

@Injectable()
export class PageCompositionExecutor {
  constructor(
    @Inject(CONTENT_TYPES.applications.CreatePageHandler)
    private readonly createPageHandler: CreatePageHandler,

    @Inject(CONTENT_TYPES.applications.CreatePageBlockHandler)
    private readonly createPageBlockHandler: CreatePageBlockHandler,

    @Inject(CONTENT_TYPES.applications.AddDatabaseViewToBlockHandler)
    private readonly addDatabaseViewToBlockHandler: AddDatabaseViewToBlockHandler,

    private readonly createDatabaseHandler: CreateDatabaseHandler,

    private readonly renamePropertyHandler: RenamePropertyHandler,

    private readonly addPropertyHandler: AddPropertyHandler,

    private readonly addPropertyOptionHandler: AddPropertyOptionHandler,

    private readonly createDatabaseViewHandler: CreateDatabaseViewHandler,

    private readonly createDatabaseRowHandler: CreateDatabaseRowHandler,

    private readonly setRowValueHandler: SetRowValueHandler,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    params: ExecutePageCompositionParams,
  ): Promise<PageCompositionExecutionResult> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const page = await this.createPageHandler.execute(
        new CreatePageCommand(
          params.userId,
          params.workspaceId,
          params.draft.page.title,
          params.teamspaceId ?? null,
          params.parentPageId ?? null,
          params.draft.page.icon ?? null,
          params.draft.page.coverUrl ?? null,
        ),
        context,
      );

      const blockIds = await this.createBlocks(
        params.userId,
        page.id,
        params.draft.blocks,
      );

      const { databaseIds, propertyIds, optionIds, viewIds, rowIds } =
        await this.createDatabases(page.id, params.draft.databases, context);

      await this.attachDatabaseViews(
        params.draft.blocks,
        blockIds,
        databaseIds,
        viewIds,
      );

      return {
        pageId: page.id,
        blockIds: Object.fromEntries(blockIds),
        databaseIds: Object.fromEntries(databaseIds),
        propertyIds: Object.fromEntries(propertyIds),

        optionIds: Object.fromEntries(
          Array.from(optionIds.entries()).map(([propertyRef, options]) => [
            propertyRef,
            Object.fromEntries(options),
          ]),
        ),

        viewIds: Object.fromEntries(
          Array.from(viewIds.entries()).map(([databaseRef, views]) => [
            databaseRef,
            Object.fromEntries(views),
          ]),
        ),

        rowIds: Object.fromEntries(
          Array.from(rowIds.entries()).map(([databaseRef, rows]) => [
            databaseRef,
            Object.fromEntries(rows),
          ]),
        ),
      };
    });
  }

  private async createBlocks(
    userId: string,
    pageId: string,
    blocks: PageCompositionBlockDraft[],
  ): Promise<Map<string, string>> {
    const blockIds = new Map<string, string>();

    const sourceIndex = new Map<PageCompositionBlockDraft, number>(
      blocks.map((block, index) => [block, index]),
    );

    const blocksByParent = new Map<
      string | null,
      PageCompositionBlockDraft[]
    >();

    for (const block of blocks) {
      const parentRef = this.normalizeOptionalRef(block.parentRef);

      const siblings = blocksByParent.get(parentRef) ?? [];

      siblings.push(block);

      blocksByParent.set(parentRef, siblings);
    }

    for (const siblings of blocksByParent.values()) {
      siblings.sort((a, b) => {
        const aOrder = a.orderIndex ?? sourceIndex.get(a) ?? 0;

        const bOrder = b.orderIndex ?? sourceIndex.get(b) ?? 0;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return (sourceIndex.get(a) ?? 0) - (sourceIndex.get(b) ?? 0);
      });
    }

    await this.createSiblingGroup({
      userId,
      pageId,
      parentRef: null,
      parentBlockId: null,
      blocksByParent,
      blockIds,
    });

    return blockIds;
  }

  private async createSiblingGroup(params: {
    userId: string;
    pageId: string;
    parentRef: string | null;
    parentBlockId: string | null;
    blocksByParent: Map<string | null, PageCompositionBlockDraft[]>;
    blockIds: Map<string, string>;
  }): Promise<void> {
    const siblings = params.blocksByParent.get(params.parentRef) ?? [];

    let afterBlockId: string | null = null;

    for (const block of siblings) {
      const input: ConstructorParameters<typeof CreatePageBlockCommand>[0] = {
        pageId: params.pageId,
        parentBlockId: params.parentBlockId,
        afterBlockId,
        type: block.type,
        createdBy: params.userId,
      };

      if ('content' in block) {
        input.content = block.content;
      }

      if ('styleConfig' in block && block.styleConfig !== undefined) {
        input.styleConfig = block.styleConfig;
      }

      const createdBlock = await this.createPageBlockHandler.execute(
        new CreatePageBlockCommand(input),
      );

      const blockRef = this.normalizeRef(block.ref);

      params.blockIds.set(blockRef, createdBlock.id);

      afterBlockId = createdBlock.id;

      await this.createSiblingGroup({
        userId: params.userId,
        pageId: params.pageId,
        parentRef: blockRef,
        parentBlockId: createdBlock.id,
        blocksByParent: params.blocksByParent,
        blockIds: params.blockIds,
      });
    }
  }

  private async attachDatabaseViews(
    blocks: PageCompositionBlockDraft[],
    blockIds: Map<string, string>,
    databaseIds: Map<string, string>,
    viewIds: Map<string, Map<string, string>>,
  ): Promise<void> {
    for (const block of blocks) {
      if (block.type !== PageBlockType.DATABASE_VIEW) {
        continue;
      }

      const blockRef = this.normalizeRef(block.ref);

      const databaseRef = this.normalizeRef(block.databaseRef);

      const viewRef = this.normalizeRef(block.viewRef);

      const blockId = blockIds.get(blockRef);

      if (!blockId) {
        throw new Error(
          `DATABASE_VIEW block "${blockRef}" has not been created`,
        );
      }

      const databaseId = databaseIds.get(databaseRef);

      if (!databaseId) {
        throw new Error(`Database "${databaseRef}" has not been created`);
      }

      const viewId = viewIds.get(databaseRef)?.get(viewRef);

      if (!viewId) {
        throw new Error(
          `View "${viewRef}" for database "${databaseRef}" has not been created`,
        );
      }

      await this.addDatabaseViewToBlockHandler.execute(
        new AddDatabaseViewToBlockCommand(blockId, {
          database_id: databaseId,
          view_id: viewId,
        }),
      );
    }
  }

  private async createDatabases(
    pageId: string,
    databases: PageCompositionDatabaseDraft[],
    context: PersistenceContext,
  ): Promise<{
    databaseIds: Map<string, string>;
    propertyIds: Map<string, string>;
    optionIds: Map<string, Map<string, string>>;
    viewIds: Map<string, Map<string, string>>;
    rowIds: Map<string, Map<string, string>>;
  }> {
    const databaseIds = new Map<string, string>();

    const propertyIds = new Map<string, string>();

    const optionIds = new Map<string, Map<string, string>>();

    const viewIds = new Map<string, Map<string, string>>();

    const rowIds = new Map<string, Map<string, string>>();

    for (const databaseDraft of databases) {
      const database = await this.createDatabaseHandler.execute(
        new CreateDatabaseCommand(pageId, databaseDraft.name),
        context,
      );

      const databaseRef = this.normalizeRef(databaseDraft.ref);

      databaseIds.set(databaseRef, database.getId());

      const defaultTitleProperty = database
        .getProperties()
        .find((property) => property.getType() === PropertyType.TITLE);

      if (!defaultTitleProperty) {
        throw new Error('Created database is missing default TITLE property');
      }

      const titleDraft = databaseDraft.properties.find(
        (property) => property.type === PropertyType.TITLE,
      );

      if (titleDraft) {
        const titleRef = this.normalizeRef(titleDraft.ref);

        propertyIds.set(titleRef, defaultTitleProperty.getId());

        if (titleDraft.name.trim() !== defaultTitleProperty.getName()) {
          await this.renamePropertyHandler.execute(
            new RenamePropertyCommand(
              database.getId(),
              defaultTitleProperty.getId(),
              titleDraft.name,
            ),
            context,
          );
        }
      }

      for (const propertyDraft of databaseDraft.properties) {
        if (propertyDraft.type === PropertyType.TITLE) {
          continue;
        }

        const createdProperty = await this.addPropertyHandler.execute(
          new AddPropertyCommand(
            database.getId(),
            propertyDraft.name,
            propertyDraft.type,
          ),
          context,
        );

        const propertyRef = this.normalizeRef(propertyDraft.ref);

        propertyIds.set(propertyRef, createdProperty.id);

        if (propertyDraft.type === PropertyType.SELECT) {
          const propertyOptionIds = new Map<string, string>();

          for (const optionDraft of propertyDraft.options) {
            const createdOption = await this.addPropertyOptionHandler.execute(
              new AddPropertyOptionCommand(
                database.getId(),
                createdProperty.id,
                optionDraft.name,
                optionDraft.color ?? null,
              ),
              context,
            );

            propertyOptionIds.set(
              this.normalizeRef(optionDraft.ref),
              createdOption.getId(),
            );
          }

          optionIds.set(propertyRef, propertyOptionIds);
        }
      }

      const databaseViewIds = new Map<string, string>();

      for (const viewDraft of databaseDraft.views) {
        const createdView = await this.createDatabaseViewHandler.execute(
          new CreateDatabaseViewCommand(
            database.getId(),
            viewDraft.name,
            viewDraft.type,
          ),
          context,
        );

        databaseViewIds.set(this.normalizeRef(viewDraft.ref), createdView.id);
      }

      viewIds.set(databaseRef, databaseViewIds);

      const databaseRowIds = new Map<string, string>();

      for (const rowDraft of databaseDraft.rows) {
        const createdRow = await this.createDatabaseRowHandler.execute(
          new CreateDatabaseRowCommand(database.getId()),
          context,
        );

        const rowRef = this.normalizeOptionalRef(rowDraft.ref);

        if (rowRef !== null) {
          databaseRowIds.set(rowRef, createdRow.getId());
        }

        for (const [rawPropertyRef, draftValue] of Object.entries(
          rowDraft.values,
        )) {
          const propertyRef = this.normalizeRef(rawPropertyRef);

          const propertyDraft = databaseDraft.properties.find(
            (property) => this.normalizeRef(property.ref) === propertyRef,
          );

          if (!propertyDraft) {
            throw new Error(
              `Database row references unknown property "${propertyRef}"`,
            );
          }

          const propertyId = propertyIds.get(propertyRef);

          if (!propertyId) {
            throw new Error(`Property "${propertyRef}" has not been created`);
          }

          const resolvedValue = this.resolveRowValue(
            propertyDraft,
            draftValue,
            optionIds,
          );

          await this.setRowValueHandler.execute(
            new SetRowValueCommand(
              createdRow.getId(),
              propertyId,
              resolvedValue,
            ),
            context,
          );
        }
      }

      rowIds.set(databaseRef, databaseRowIds);
    }

    return {
      databaseIds,
      propertyIds,
      optionIds,
      viewIds,
      rowIds,
    };
  }

  private resolveRowValue(
    propertyDraft: PageCompositionDatabaseDraft['properties'][number],
    value: PageCompositionDatabaseDraft['rows'][number]['values'][string],
    optionIds: Map<string, Map<string, string>>,
  ): RowValueData {
    if (value === null) {
      return null;
    }

    if (propertyDraft.type !== PropertyType.SELECT) {
      return value as RowValueData;
    }

    if (
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !('optionRef' in value) ||
      typeof value.optionRef !== 'string'
    ) {
      throw new Error(
        `SELECT property "${propertyDraft.ref}" requires an optionRef`,
      );
    }

    const propertyRef = this.normalizeRef(propertyDraft.ref);

    const optionRef = this.normalizeRef(value.optionRef);

    const optionId = optionIds.get(propertyRef)?.get(optionRef);

    if (!optionId) {
      throw new Error(
        `SELECT option "${optionRef}" for property "${propertyRef}" has not been created`,
      );
    }

    return optionId;
  }

  private normalizeRef(ref: string): string {
    return ref.trim();
  }

  private normalizeOptionalRef(ref: string | null | undefined): string | null {
    if (ref === undefined || ref === null) {
      return null;
    }

    return ref.trim();
  }
}
